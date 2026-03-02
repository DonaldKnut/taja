/**
 * Gokada Delivery API Integration
 * 
 * Gokada is a Nigerian on-demand delivery service operating in Lagos and other major cities.
 * API Documentation: https://developers.gokada.ng/
 * 
 * Features:
 * - Create delivery orders
 * - Track deliveries in real-time
 * - Calculate delivery costs
 * - Manage delivery riders
 * - Webhook handling for status updates
 */

const GOKADA_API_KEY = process.env.GOKADA_API_KEY || "";
const GOKADA_API_URL = process.env.GOKADA_API_URL || "https://api.gokada.ng/v1";
const GOKADA_MODE = process.env.GOKADA_MODE || "sandbox"; // sandbox or production

// Types
export interface GokadaAddress {
  address: string;
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  email?: string;
}

export interface GokadaOrderRequest {
  pickup: GokadaAddress;
  dropoff: GokadaAddress;
  package_details: {
    weight: number; // in kg
    size?: "small" | "medium" | "large" | "xlarge";
    description?: string;
    value?: number; // value in Naira for insurance
    fragile?: boolean;
  };
  delivery_type?: "instant" | "same_day" | "scheduled";
  scheduled_time?: string; // ISO 8601 format for scheduled deliveries
  payment_method?: "prepaid" | "cash_on_delivery";
  customer_reference?: string;
  notes?: string;
}

export interface GokadaOrderResponse {
  success: boolean;
  data?: {
    order_id: string;
    tracking_number: string;
    status: string;
    estimated_pickup_time: string;
    estimated_delivery_time: string;
    price: number;
    currency: string;
    rider?: {
      name: string;
      phone: string;
      vehicle_type: string;
      vehicle_number: string;
      current_location?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  message?: string;
}

export interface GokadaTrackingResponse {
  success: boolean;
  data?: {
    order_id: string;
    tracking_number: string;
    status: 
      | "pending"
      | "assigned"
      | "picked_up"
      | "in_transit"
      | "arrived"
      | "delivered"
      | "cancelled"
      | "failed";
    status_history: Array<{
      status: string;
      timestamp: string;
      location?: string;
      note?: string;
    }>;
    current_location?: {
      latitude: number;
      longitude: number;
      address?: string;
      updated_at: string;
    };
    pickup: GokadaAddress;
    dropoff: GokadaAddress;
    rider?: {
      name: string;
      phone: string;
      vehicle_type: string;
      vehicle_number: string;
      rating: number;
      current_location?: {
        latitude: number;
        longitude: number;
      };
    };
    estimated_delivery_time?: string;
    actual_delivery_time?: string;
    proof_of_delivery?: {
      signature_url?: string;
      photo_url?: string;
      recipient_name?: string;
      timestamp: string;
    };
  };
  message?: string;
}

export interface GokadaPriceEstimate {
  success: boolean;
  data?: {
    base_price: number;
    distance_charge: number;
    weight_charge: number;
    surge_multiplier: number;
    total_price: number;
    currency: string;
    estimated_distance: number; // in km
    estimated_duration: number; // in minutes
  };
  message?: string;
}

export interface GokadaWebhookPayload {
  event: 
    | "order.created"
    | "order.assigned"
    | "order.picked_up"
    | "order.in_transit"
    | "order.arrived"
    | "order.delivered"
    | "order.cancelled"
    | "order.failed"
    | "rider.location_updated";
  data: {
    order_id: string;
    tracking_number: string;
    status?: string;
    timestamp: string;
    rider?: {
      id: string;
      name: string;
      phone: string;
      current_location?: {
        latitude: number;
        longitude: number;
      };
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    note?: string;
  };
}

/**
 * Check if Gokada API is configured
 */
export function isGokadaConfigured(): boolean {
  return !!(GOKADA_API_KEY && GOKADA_API_URL);
}

/**
 * Get API headers for Gokada requests
 */
function getGokadaHeaders(): Record<string, string> {
  return {
    "Authorization": `Bearer ${GOKADA_API_KEY}`,
    "Content-Type": "application/json",
    "X-Environment": GOKADA_MODE,
  };
}

/**
 * Create a new delivery order with Gokada
 */
export async function createGokadaOrder(
  request: GokadaOrderRequest
): Promise<GokadaOrderResponse> {
  if (!isGokadaConfigured()) {
    throw new Error("Gokada API is not configured. Please add GOKADA_API_KEY to your environment variables.");
  }

  const response = await fetch(`${GOKADA_API_URL}/orders`, {
    method: "POST",
    headers: getGokadaHeaders(),
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create Gokada order");
  }

  return data;
}

/**
 * Get order details and tracking information
 */
export async function trackGokadaOrder(
  trackingNumber: string
): Promise<GokadaTrackingResponse> {
  if (!isGokadaConfigured()) {
    throw new Error("Gokada API is not configured");
  }

  const response = await fetch(`${GOKADA_API_URL}/orders/${trackingNumber}/track`, {
    method: "GET",
    headers: getGokadaHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to track Gokada order");
  }

  return data;
}

/**
 * Get real-time price estimate for a delivery
 */
export async function getGokadaPriceEstimate(
  pickup: Pick<GokadaAddress, "latitude" | "longitude">,
  dropoff: Pick<GokadaAddress, "latitude" | "longitude">,
  weight: number = 1,
  size: "small" | "medium" | "large" | "xlarge" = "small"
): Promise<GokadaPriceEstimate> {
  if (!isGokadaConfigured()) {
    throw new Error("Gokada API is not configured");
  }

  const response = await fetch(`${GOKADA_API_URL}/pricing/estimate`, {
    method: "POST",
    headers: getGokadaHeaders(),
    body: JSON.stringify({
      pickup_latitude: pickup.latitude,
      pickup_longitude: pickup.longitude,
      dropoff_latitude: dropoff.latitude,
      dropoff_longitude: dropoff.longitude,
      weight,
      size,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get price estimate");
  }

  return data;
}

/**
 * Cancel an existing order
 */
export async function cancelGokadaOrder(
  trackingNumber: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  if (!isGokadaConfigured()) {
    throw new Error("Gokada API is not configured");
  }

  const response = await fetch(`${GOKADA_API_URL}/orders/${trackingNumber}/cancel`, {
    method: "POST",
    headers: getGokadaHeaders(),
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to cancel order");
  }

  return data;
}

/**
 * Validate webhook signature from Gokada
 */
export function verifyGokadaWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

/**
 * Get available cities where Gokada operates
 */
export async function getGokadaCities(): Promise<string[]> {
  // Gokada currently operates in these Nigerian cities
  return ["Lagos", "Abuja", "Ibadan", "Port Harcourt"];
}

/**
 * Map Gokada status to our internal order status
 */
export function mapGokadaStatusToOrderStatus(
  gokadaStatus: string
): string {
  const statusMap: Record<string, string> = {
    "pending": "processing",
    "assigned": "processing",
    "picked_up": "shipped",
    "in_transit": "shipped",
    "arrived": "out_for_delivery",
    "delivered": "delivered",
    "cancelled": "cancelled",
    "failed": "delivery_failed",
  };
  return statusMap[gokadaStatus] || gokadaStatus;
}

/**
 * Calculate delivery cost with markup for platform
 */
export function calculateDeliveryCostWithMarkup(
  baseCost: number,
  markupPercentage: number = 10
): {
  baseCost: number;
  markup: number;
  platformFee: number;
  totalCost: number;
} {
  const markup = Math.round((baseCost * markupPercentage) / 100);
  const platformFee = Math.round((baseCost * 5) / 100); // 5% platform fee
  const totalCost = baseCost + markup + platformFee;

  return {
    baseCost,
    markup,
    platformFee,
    totalCost,
  };
}
