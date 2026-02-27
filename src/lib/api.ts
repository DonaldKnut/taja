// Use internal API routes (fullstack Next.js)
// All API calls now go to internal Next.js API routes
export const API_BASE_URL = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';

type Options = RequestInit & { auth?: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api(path: string, opts: Options = {}) {
  // Use internal routes - all paths should start with /api
  const url = path.startsWith("http") ? path : path.startsWith("/api") ? path : `/api${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as any),
  };
  
  // Auto-inject token from localStorage if not provided
  if (!opts.auth && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } else if (opts.auth) {
    headers.Authorization = `Bearer ${opts.auth}`;
  }

  // Log the API call in development
  if (process.env.NODE_ENV === "development") {
    console.log("🌐 API Call:", {
      method: opts.method || "GET",
      url: url,
      path: path,
      baseUrl: API_BASE_URL,
      hasToken: !!headers.Authorization,
    });
  }

  try {
    const res = await fetch(url, { ...opts, headers, cache: "no-store" });
    
    if (process.env.NODE_ENV === "development") {
      console.log("📥 API Response:", {
        url: url,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });
    }
    
    // Handle network errors
    if (!res.ok && res.status === 0) {
      throw new ApiError(
        "Network error: Failed to connect to server. Please check your internet connection.",
        0
      );
    }
    
    const data = await res.json().catch((err) => {
      console.error("Failed to parse JSON response:", err);
      throw new ApiError("Invalid response from server", res.status);
    });
    
    if (!res.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        data.data?.message ||
        res.statusText ||
        "Request failed";
      
      // Handle 401 Unauthorized - token expired
      if (res.status === 401) {
        // Clear auth data
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
        }
        // Redirect to login if not already there
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
        }
      }
      
      throw new ApiError(errorMessage, res.status, data);
    }
    
    return data;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Wrap other errors
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    
    throw new ApiError("An unexpected error occurred");
  }
}

// Helper to get auth token
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// Post API helpers
export const postsApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; shopId?: string; userId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.category) query.append("category", params.category);
    if (params?.shopId) query.append("shopId", params.shopId);
    if (params?.userId) query.append("userId", params.userId);
    if (params?.search) query.append("search", params.search);
    return api(`/api/posts?${query.toString()}`);
  },
  getFeatured: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : "";
    return api(`/api/posts/featured${query}`);
  },
  getById: (postId: string) => api(`/api/posts/${postId}`),
  search: (query: string, page?: number, limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    return api(`/api/posts/search?${params.toString()}`);
  },
  getUserPosts: (userId: string, page?: number, limit?: number, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (status) params.append("status", status);
    return api(`/api/posts/user/${userId}?${params.toString()}`);
  },
  getShopPosts: (shopId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    return api(`/api/posts/shop/${shopId}?${params.toString()}`);
  },
  create: (data: any) => api("/api/posts", { method: "POST", body: JSON.stringify(data) }),
  update: (postId: string, data: any) => api(`/api/posts/${postId}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (postId: string) => api(`/api/posts/${postId}`, { method: "DELETE" }),
  like: (postId: string) => api(`/api/posts/${postId}/like`, { method: "POST" }),
  pin: (postId: string) => api(`/api/posts/${postId}/pin`, { method: "POST" }),
  feature: (postId: string) => api(`/api/posts/${postId}/feature`, { method: "POST" }),
};

// Comment API helpers
export const commentsApi = {
  getPostComments: (postId: string, page?: number, limit?: number, parentId?: string) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (parentId) params.append("parentId", parentId);
    return api(`/api/comments/post/${postId}?${params.toString()}`);
  },
  getProductComments: (productId: string, page?: number, limit?: number, parentId?: string) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (parentId) params.append("parentId", parentId);
    return api(`/api/comments/product/${productId}?${params.toString()}`);
  },
  getReplies: (commentId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    return api(`/api/comments/${commentId}/replies?${params.toString()}`);
  },
  getUserComments: (userId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    return api(`/api/comments/user/${userId}?${params.toString()}`);
  },
  createPostComment: (postId: string, data: { content: string; images?: string[]; parentCommentId?: string }) =>
    api(`/api/comments/post/${postId}`, { method: "POST", body: JSON.stringify(data) }),
  createProductComment: (productId: string, data: { content: string; images?: string[]; parentCommentId?: string }) =>
    api(`/api/comments/product/${productId}`, { method: "POST", body: JSON.stringify(data) }),
  update: (commentId: string, data: { content?: string; images?: string[] }) =>
    api(`/api/comments/${commentId}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (commentId: string) => api(`/api/comments/${commentId}`, { method: "DELETE" }),
  like: (commentId: string) => api(`/api/comments/${commentId}/like`, { method: "POST" }),
  report: (commentId: string, reason: string) =>
    api(`/api/comments/${commentId}/report`, { method: "POST", body: JSON.stringify({ reason }) }),
};

// Shops API helpers
export const shopsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string; verified?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.verified !== undefined) query.append("verified", params.verified.toString());
    return api(`/api/shops?${query.toString()}`);
  },
  // Use dedicated slug route to avoid treating slug as MongoDB ObjectId
  getBySlug: (slug: string) => api(`/api/shops/slug/${slug}`),
  create: (data: {
    shopName: string;
    description?: string;
    about?: string;
    tagline?: string;
    categories?: string[];
    shopSlug?: string;
    logo?: string;
    banner?: string;
    avatar?: string;
    coverImage?: string;
    socialLinks?: {
      instagram?: string;
      whatsapp?: string;
      twitter?: string;
      facebook?: string;
      website?: string;
    };
    settings?: {
      responseTime?: string;
      shippingMethods?: string[];
      returnPolicy?: string;
    };
    policies?: {
      returns?: string;
      shipping?: string;
      cancellations?: string;
    };
  }) =>
    api("/api/shops", { method: "POST", body: JSON.stringify(data) }),
  update: (shopId: string, data: any) =>
    api(`/api/shops/${shopId}`, { method: "PUT", body: JSON.stringify(data) }),
  getAnalytics: (shopId: string, period?: string) => {
    const query = period ? `?period=${period}` : "";
    return api(`/api/shops/${shopId}/analytics${query}`);
  },
};

// Upload API helper for shop images
export async function uploadShopImage(file: File, type: "logo" | "banner"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || data.error || "Upload failed", response.status, data);
  }
  return data.data.url || data.data;
}

// Upload API helper for product images
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "product");

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || data.error || "Upload failed", response.status, data);
  }
  return data.data.url || data.data;
}

// Upload API helper for profile avatar
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "avatar");

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || data.error || "Upload failed", response.status, data);
  }
  return data.data?.url ?? data.data;
}

// Users API helpers
export const usersApi = {
  getProfile: () => api("/api/users/me"),
  getMe: () => api("/api/users/me"), // Alias for getProfile
  updateProfile: (data: any) => api("/api/users/me", { method: "PUT", body: JSON.stringify(data) }),
  updateMe: (data: any) => api("/api/users/me", { method: "PUT", body: JSON.stringify(data) }), // Alias for updateProfile
  deleteAccount: () => api("/api/users/me", { method: "DELETE" }),
  changePassword: (currentPassword: string, newPassword: string) => 
    api("/api/users/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) }),
  exportData: () => api("/api/users/export"),
  getAddresses: () => api("/api/users/addresses"),
  addAddress: (data: any) => api("/api/users/addresses", { method: "POST", body: JSON.stringify(data) }),
  updateAddress: (addressId: string, data: any) => api(`/api/users/addresses/${addressId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAddress: (addressId: string) => api(`/api/users/addresses/${addressId}`, { method: "DELETE" }),
  getPaymentMethods: () => api("/api/users/payment-methods"),
  addPaymentMethod: (data: any) => api("/api/users/payment-methods", { method: "POST", body: JSON.stringify(data) }),
  updatePaymentMethod: (paymentMethodId: string, data: any) => api(`/api/users/payment-methods/${paymentMethodId}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePaymentMethod: (paymentMethodId: string) => api(`/api/users/payment-methods/${paymentMethodId}`, { method: "DELETE" }),
};

// Notifications API helpers
export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; unread?: boolean; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.unread) query.append("unread", "true");
    if (params?.type) query.append("type", params.type);
    return api(`/api/notifications?${query.toString()}`);
  },
  markAsRead: (notificationId: string) => 
    api(`/api/notifications/${notificationId}`, { method: "PUT", body: JSON.stringify({ read: true }) }),
  markAllAsRead: () => 
    api("/api/notifications/mark-all-read", { method: "PUT" }),
  deleteNotification: (notificationId: string) => 
    api(`/api/notifications/${notificationId}`, { method: "DELETE" }),
  createNotification: (data: {
    userId?: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    actionUrl?: string;
    priority?: string;
    imageUrl?: string;
  }) => api("/api/notifications", { method: "POST", body: JSON.stringify(data) }),
};

// Unified Search API helper
export const searchApi = {
  search: (query: string, type?: 'all' | 'products' | 'shops' | 'categories', limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (type && type !== 'all') params.append("type", type);
    if (limit) params.append("limit", limit.toString());
    return api(`/api/search?${params.toString()}`);
  },
};

// Cart API helpers
export const cartApi = {
  getCart: () => api("/api/cart"),
  addToCart: (productId: string, quantity: number = 1) => api("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (itemId: string, quantity: number) => api(`/api/cart/${itemId}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  removeFromCart: (itemId: string) => api(`/api/cart/${itemId}`, { method: "DELETE" }),
  clearCart: () => api("/api/cart", { method: "DELETE" }),
  mergeCart: (items: Array<{ product: string; quantity: number }>) => api("/api/cart/merge", { method: "POST", body: JSON.stringify({ items }) }),
};

// Checkout API helpers
export const checkoutApi = {
  createOrder: (data: any) => api("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  getOrder: (orderId: string) => api(`/api/orders/${orderId}`),
  getOrders: (params?: { page?: number; limit?: number; status?: string; role?: "buyer" | "seller" }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.role) query.append("role", params.role);
    return api(`/api/orders?${query.toString()}`);
  },
  applyCoupon: (couponCode: string) => api("/api/checkout/coupon", { method: "POST", body: JSON.stringify({ code: couponCode }) }),
};

// Products API helpers
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; shopId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.category) query.append("category", params.category);
    if (params?.shopId) query.append("shopId", params.shopId);
    if (params?.search) query.append("search", params.search);
    return api(`/api/products?${query.toString()}`);
  },
  getFeatured: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : "";
    return api(`/api/products/featured${query}`);
  },
  getBySlug: (slug: string) => api(`/api/products/${slug}`),
  getById: (productId: string) => api(`/api/products/${productId}`),
  search: (query: string, page?: number, limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    return api(`/api/products/search?${params.toString()}`);
  },
};

// Seller API helpers
export const sellerApi = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    category?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    return api(`/api/seller/products?${query.toString()}`);
  },
  getProduct: (productId: string) => api(`/api/products/${productId}`),
  createProduct: (data: any) =>
    api("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (productId: string, data: any) =>
    api(`/api/products/${productId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (productId: string) =>
    api(`/api/products/${productId}`, { method: "DELETE" }),
  getDashboard: () => api("/api/seller/dashboard"),
  getAnalytics: (period?: string) => {
    const query = period ? `?period=${period}` : "";
    return api(`/api/seller/analytics${query}`);
  },
};

// Wishlist API helpers
export const wishlistApi = {
  getWishlist: () => api("/api/wishlist"),
  getAll: (params?: { limit?: number; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.page) query.append("page", params.page.toString());
    const queryString = query.toString();
    return api(`/api/wishlist${queryString ? `?${queryString}` : ""}`);
  },
  addToWishlist: (productId: string) => api("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) }),
  removeFromWishlist: (productId: string) => api(`/api/wishlist/${productId}`, { method: "DELETE" }),
  remove: (productId: string) => api(`/api/wishlist/${productId}`, { method: "DELETE" }), // Alias for removeFromWishlist
  isInWishlist: (productId: string) => api(`/api/wishlist/${productId}`),
};

// Tracking API helpers
export const trackingApi = {
  trackOrder: (trackingNumber: string) => api(`/api/tracking/${trackingNumber}`),
  getTracking: (trackingNumber: string) => api(`/api/tracking/${trackingNumber}`), // Alias for trackOrder
  getTrackingHistory: (orderId: string) => api(`/api/tracking/order/${orderId}`),
};

// Support Ticket API helpers
export const supportApi = {
  createTicket: (data: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    relatedOrderId?: string;
    relatedProductId?: string;
    relatedShopId?: string;
    attachments?: Array<{ url: string; filename: string; type: string; size: number }>;
  }) => api("/api/support/tickets", { method: "POST", body: JSON.stringify(data) }),
  getTickets: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    assignedTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.category) query.append("category", params.category);
    if (params?.priority) query.append("priority", params.priority);
    if (params?.search) query.append("search", params.search);
    if (params?.assignedTo) query.append("assignedTo", params.assignedTo);
    const queryString = query.toString();
    return api(`/api/support/tickets${queryString ? `?${queryString}` : ""}`);
  },
  getTicket: (ticketId: string) => api(`/api/support/tickets/${ticketId}`),
  updateTicket: (ticketId: string, data: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    tags?: string[];
    satisfactionRating?: number;
    satisfactionFeedback?: string;
  }) => api(`/api/support/tickets/${ticketId}`, { method: "PUT", body: JSON.stringify(data) }),
  addMessage: (ticketId: string, data: {
    content: string;
    attachments?: Array<{ url: string; filename: string; type: string; size: number }>;
    isInternal?: boolean;
  }) => api(`/api/support/tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify(data) }),
};
