"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Separator } from "@/components/ui/Separator";
import { Progress } from "@/components/ui/Progress";
import {
  Upload,
  X,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  Video,
  Image as ImageIcon,
  Package,
  Truck,
  Tag,
  Eye,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Edit3,
  Copy,
  Share2,
  Download,
  Maximize2,
  RotateCcw,
  RotateCw,
  Crop,
  Filter,
  Palette,
  Zap,
  Star,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Flag,
  Shield,
  Lock,
  Unlock,
  EyeOff,
  Settings,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Calendar,
  Clock,
  MapPin,
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
  ArrowRight,
  ArrowLeft,
  Check,
  X as XIcon,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Menu,
  User,
  Users,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Wallet,
  Gift,
  Award,
  Trophy,
  Crown,
  Diamond,
  Gem,
  Sparkles,
  Wand2,
  Rocket,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Zap as ZapIcon,
  Calendar as CalendarIcon,

} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { CategoryPickerModal, categoryPickerLabel } from "@/components/product";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: "image" | "video";
  thumbnail?: string;
  duration?: number;
  size: number;
  status: "uploading" | "uploaded" | "error";
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories: Category[];
}

interface FormData {
  // Basic Info
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: "new" | "like-new" | "good" | "fair" | "poor";

  // Pricing
  price: number;
  compareAtPrice: number;
  currency: string;

  // Media
  images: string[];
  videos: {
    url: string;
    thumbnail?: string;
    duration?: number;
    type: "video";
  }[];

  // Specifications
  specifications: {
    brand: string;
    size: string;
    color: string;
    material: string;
    gender: "men" | "women" | "unisex" | "kids";
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    [key: string]: any;
  };

  // Inventory
  inventory: {
    quantity: number;
    sku: string;
    trackQuantity: boolean;
  };

  // Shipping
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    shippingCost: number;
    processingTime: "1-2-days" | "3-5-days" | "1-week" | "2-weeks";
  };

  // SEO
  seo: {
    tags: string[];
    metaTitle: string;
    metaDescription: string;
  };

  // Settings
  status: "draft" | "active";
  featured: boolean;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  category: "",
  subcategory: "",
  condition: "new",
  price: 0,
  compareAtPrice: 0,
  currency: "NGN",
  images: [],
  videos: [],
  specifications: {
    brand: "",
    size: "",
    color: "",
    material: "",
    gender: "unisex",
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
  },
  inventory: {
    quantity: 1,
    sku: "",
    trackQuantity: true,
  },
  shipping: {
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    freeShipping: false,
    shippingCost: 0,
    processingTime: "1-2-days",
  },
  seo: {
    tags: [],
    metaTitle: "",
    metaDescription: "",
  },
  status: "draft",
  featured: false,
};

export default function AdvancedProductUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [customSpecInput, setCustomSpecInput] = useState({
    key: "",
    value: "",
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const selectedCategoryLabel = useMemo(() => {
    if (!formData.category) return "Select category";
    const c = categories.find((x) => String(x._id) === String(formData.category));
    return c ? categoryPickerLabel(c as { _id: string; name: string; parent?: unknown }) : "Select category";
  }, [formData.category, categories]);

  const steps = [
    { id: 1, title: "Basic Info", description: "Product details and category" },
    { id: 2, title: "Media", description: "Images and videos" },
    { id: 3, title: "Specifications", description: "Product specifications" },
    { id: 4, title: "Pricing", description: "Price and inventory" },
    { id: 5, title: "Shipping", description: "Shipping and delivery" },
    { id: 6, title: "SEO", description: "Search optimization" },
    { id: 7, title: "Review", description: "Preview and publish" },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.category) {
      loadSubcategories(formData.category);
    } else {
      setSubcategories([]);
    }
  }, [formData.category]);

  const loadCategories = async () => {
    try {
      const data = await api("/api/seller/categories");
      if (data?.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const response = await fetch(
        `/api/categories/${categoryId}/subcategories`
      );
      const data = await response.json();
      if (data.success) {
        setSubcategories(data.data);
      }
    } catch (error) {
      console.error("Error loading subcategories:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileUpload = async (files: FileList, type: "image" | "video") => {
    const fileArray = Array.from(files);
    const newMediaFiles: MediaFile[] = fileArray.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      type,
      size: file.size,
      status: "uploading",
    }));

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < newMediaFiles.length; i++) {
        const mediaFile = newMediaFiles[i];
        const formData = new FormData();
        formData.append(type === "image" ? "image" : "video", mediaFile.file);

        const response = await fetch(`/api/upload/${type}`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === mediaFile.id
                ? { ...f, status: "uploaded", url: result.data.url }
                : f
            )
          );

          if (type === "image") {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, result.data.url],
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              videos: [
                ...prev.videos,
                {
                  url: result.data.url,
                  thumbnail: result.data.thumbnail,
                  duration: result.data.duration,
                  type: "video",
                },
              ],
            }));
          }
        } else {
          setMediaFiles((prev) =>
            prev.map((f) =>
              f.id === mediaFile.id ? { ...f, status: "error" } : f
            )
          );
        }

        setUploadProgress(((i + 1) / newMediaFiles.length) * 100);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeMediaFile = (id: string, type: "image" | "video") => {
    setMediaFiles((prev) => prev.filter((f) => f.id !== id));

    if (type === "image") {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, index) => {
          const fileIndex = mediaFiles.findIndex((f) => f.id === id);
          return index !== fileIndex;
        }),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        videos: prev.videos.filter((_, index) => {
          const fileIndex = mediaFiles.findIndex((f) => f.id === id);
          return index !== fileIndex;
        }),
      }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.seo.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          tags: [...prev.seo.tags, tagInput.trim()],
        },
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        tags: prev.seo.tags.filter((t) => t !== tag),
      },
    }));
  };

  const addCustomSpec = () => {
    if (customSpecInput.key.trim() && customSpecInput.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [customSpecInput.key]: customSpecInput.value,
        },
      }));
      setCustomSpecInput({ key: "", value: "" });
    }
  };

  const removeCustomSpec = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs,
      };
    });
  };

  const handleSubmit = async (isDraft = false) => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? "draft" : "active",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          isDraft ? "Product saved as draft" : "Product published successfully"
        );
        router.push("/seller/products");
      } else {
        toast.error(result.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter product title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your product in detail"
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <button
                  type="button"
                  id="category"
                  onClick={() => setCategoryModalOpen(true)}
                  className={cn(
                    "mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !formData.category && "text-muted-foreground"
                  )}
                >
                  <span className="truncate text-left font-medium">{selectedCategoryLabel}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                </button>
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) =>
                    handleInputChange("subcategory", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory._id} value={subcategory._id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="condition">Condition *</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange("condition", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaFiles
                  .filter((f) => f.type === "image")
                  .map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <Image
                          src={file.url}
                          alt="Product"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeMediaFile(file.id, "image")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {file.status === "uploading" && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Add Image</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaFiles
                  .filter((f) => f.type === "video")
                  .map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                        <video
                          src={file.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeMediaFile(file.id, "video")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {file.status === "uploading" && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Add Video</span>
                  </div>
                </button>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFileUpload(e.target.files, "image")
              }
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFileUpload(e.target.files, "video")
              }
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.specifications.brand}
                  onChange={(e) =>
                    handleInputChange("specifications.brand", e.target.value)
                  }
                  placeholder="Enter brand name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.specifications.size}
                  onChange={(e) =>
                    handleInputChange("specifications.size", e.target.value)
                  }
                  placeholder="Enter size"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.specifications.color}
                  onChange={(e) =>
                    handleInputChange("specifications.color", e.target.value)
                  }
                  placeholder="Enter color"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.specifications.material}
                  onChange={(e) =>
                    handleInputChange("specifications.material", e.target.value)
                  }
                  placeholder="Enter material"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.specifications.gender}
                  onValueChange={(value) =>
                    handleInputChange("specifications.gender", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.specifications.weight}
                  onChange={(e) =>
                    handleInputChange(
                      "specifications.weight",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter weight"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Dimensions (cm)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.specifications.dimensions.length}
                    onChange={(e) =>
                      handleInputChange(
                        "specifications.dimensions.length",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Length"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.specifications.dimensions.width}
                    onChange={(e) =>
                      handleInputChange(
                        "specifications.dimensions.width",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Width"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.specifications.dimensions.height}
                    onChange={(e) =>
                      handleInputChange(
                        "specifications.dimensions.height",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Height"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Custom Specifications</h4>
              <div className="space-y-2">
                {Object.entries(formData.specifications)
                  .filter(
                    ([key]) =>
                      ![
                        "brand",
                        "size",
                        "color",
                        "material",
                        "gender",
                        "weight",
                        "dimensions",
                      ].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-medium capitalize">{key}:</span>
                      <span>{value}</span>
                      <button
                        onClick={() => removeCustomSpec(key)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  value={customSpecInput.key}
                  onChange={(e) =>
                    setCustomSpecInput((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                  placeholder="Specification name"
                  className="flex-1"
                />
                <Input
                  value={customSpecInput.value}
                  onChange={(e) =>
                    setCustomSpecInput((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  placeholder="Value"
                  className="flex-1"
                />
                <Button onClick={addCustomSpec} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (NGN) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    handleInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter price"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="compareAtPrice">Compare at Price (NGN)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) =>
                    handleInputChange(
                      "compareAtPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Original price for discounts"
                  className="mt-1"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.inventory.quantity}
                  onChange={(e) =>
                    handleInputChange(
                      "inventory.quantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="Enter quantity"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.inventory.sku}
                  onChange={(e) =>
                    handleInputChange("inventory.sku", e.target.value)
                  }
                  placeholder="Auto-generated if empty"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="trackQuantity"
                checked={formData.inventory.trackQuantity}
                onCheckedChange={(checked) =>
                  handleInputChange("inventory.trackQuantity", checked)
                }
              />
              <Label htmlFor="trackQuantity">Track quantity</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  handleInputChange("featured", checked)
                }
              />
              <Label htmlFor="featured">Feature this product</Label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingWeight">Shipping Weight (kg)</Label>
                <Input
                  id="shippingWeight"
                  type="number"
                  value={formData.shipping.weight}
                  onChange={(e) =>
                    handleInputChange(
                      "shipping.weight",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter weight"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="shippingCost">Shipping Cost (NGN)</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  value={formData.shipping.shippingCost}
                  onChange={(e) =>
                    handleInputChange(
                      "shipping.shippingCost",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="Enter shipping cost"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Shipping Dimensions (cm)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shippingLength">Length</Label>
                  <Input
                    id="shippingLength"
                    type="number"
                    value={formData.shipping.dimensions.length}
                    onChange={(e) =>
                      handleInputChange(
                        "shipping.dimensions.length",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Length"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingWidth">Width</Label>
                  <Input
                    id="shippingWidth"
                    type="number"
                    value={formData.shipping.dimensions.width}
                    onChange={(e) =>
                      handleInputChange(
                        "shipping.dimensions.width",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Width"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingHeight">Height</Label>
                  <Input
                    id="shippingHeight"
                    type="number"
                    value={formData.shipping.dimensions.height}
                    onChange={(e) =>
                      handleInputChange(
                        "shipping.dimensions.height",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Height"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="processingTime">Processing Time</Label>
                <Select
                  value={formData.shipping.processingTime}
                  onValueChange={(value) =>
                    handleInputChange("shipping.processingTime", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select processing time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2-days">1-2 days</SelectItem>
                    <SelectItem value="3-5-days">3-5 days</SelectItem>
                    <SelectItem value="1-week">1 week</SelectItem>
                    <SelectItem value="2-weeks">2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="freeShipping"
                  checked={formData.shipping.freeShipping}
                  onCheckedChange={(checked) =>
                    handleInputChange("shipping.freeShipping", checked)
                  }
                />
                <Label htmlFor="freeShipping">Free shipping</Label>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.seo.metaTitle}
                onChange={(e) =>
                  handleInputChange("seo.metaTitle", e.target.value)
                }
                placeholder="SEO title for search engines"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.seo.metaDescription}
                onChange={(e) =>
                  handleInputChange("seo.metaDescription", e.target.value)
                }
                placeholder="SEO description for search engines"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {formData.seo.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter tag"
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Product Preview</h3>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {previewMode ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>

            {previewMode && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">
                        {formData.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {formData.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Price:</span>
                          <span className="text-lg font-bold">
                            ₦{(formData.price || 0).toLocaleString()}
                          </span>
                        </div>
                        {formData.compareAtPrice > formData.price && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Compare at:</span>
                            <span className="text-gray-500 line-through">
                              ₦{formData.compareAtPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium">Condition:</span>
                          <span className="capitalize">
                            {formData.condition}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Quantity:</span>
                          <span>{formData.inventory.quantity}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium">Specifications:</h5>
                        {formData.specifications.brand && (
                          <div className="flex justify-between">
                            <span>Brand:</span>
                            <span>{formData.specifications.brand}</span>
                          </div>
                        )}
                        {formData.specifications.size && (
                          <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{formData.specifications.size}</span>
                          </div>
                        )}
                        {formData.specifications.color && (
                          <div className="flex justify-between">
                            <span>Color:</span>
                            <span>{formData.specifications.color}</span>
                          </div>
                        )}
                        {formData.specifications.material && (
                          <div className="flex justify-between">
                            <span>Material:</span>
                            <span>{formData.specifications.material}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">
                        Media ({formData.images.length + formData.videos.length}
                        )
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.images.slice(0, 4).map((image, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden"
                          >
                            <Image
                              src={image}
                              alt="Product"
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {formData.videos.slice(0, 2).map((video, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden"
                          >
                            <video
                              src={video.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  handleInputChange("status", checked ? "active" : "draft")
                }
              />
              <Label htmlFor="status">Publish immediately</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Product Upload
          </h1>
          <p className="text-gray-600 mt-2">
            Create a detailed product listing with advanced features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${currentStep === step.id
                      ? "bg-taja-primary text-white"
                      : "hover:bg-gray-100"
                      }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.id
                          ? "bg-white text-taja-primary"
                          : "bg-gray-200 text-gray-600"
                          }`}
                      >
                        {step.id}
                      </div>
                      <div>
                        <div className="font-medium">{step.title}</div>
                        <div
                          className={`text-xs ${currentStep === step.id
                            ? "text-white/80"
                            : "text-gray-500"
                            }`}
                        >
                          {step.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Step {currentStep}: {steps[currentStep - 1]?.title}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    {currentStep < steps.length ? (
                      <Button onClick={nextStep}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSubmit(true)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Draft
                        </Button>
                        <Button
                          onClick={() => handleSubmit(false)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Publish Product
                        </Button>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>{renderStepContent()}</CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CategoryPickerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories as { _id: string; name: string; parent?: unknown }[]}
        selectedId={formData.category}
        onSelect={(id) =>
          setFormData((prev) => ({
            ...prev,
            category: id,
            subcategory: "",
          }))
        }
        createEndpoint="/api/seller/categories"
        onCategoryCreated={(cat) =>
          setCategories((prev) =>
            prev.some((x) => String(x._id) === String(cat._id)) ? prev : [...prev, cat as Category]
          )
        }
      />
    </div>
  );
}


