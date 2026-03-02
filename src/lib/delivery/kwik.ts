/**
 * Kwik Delivery API Integration
 * 
 * Kwik is a Nigerian on-demand delivery platform with extensive coverage
 * across multiple cities. They offer various delivery options including
 * bikes, cars, and trucks.
 * 
 * API Documentation: https://developers.kwik.delivery/
 * 
 * Features:
 * - Multiple vehicle types (bike, car, van, truck)
 * - Real-time tracking
 * - Scheduled deliveries
 * - Bulk order creation
 * - Cash on delivery support
 */

const KWIK_API_KEY = process.env.KWIK_API_KEY || "";
const KWIK_API_SECRET = process.env.KWIK_API_SECRET || "";
const KWIK_API_URL = process.env.KWIK_API_URL || "https://api.kwik.delivery/v2";
const KWIK_MODE = process.env.KWIK_MODE || "sandbox";

// Types
export type KwikVehicleType = "bike" | "car" | "van" | "truck" | "bicycle";

export interface KwikAddress {
  address: string;
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  email?: string;
  instructions?: string;
}

export interface KwikPackageDetails {
  weight: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description?: string;
  category?: string;
  value?: number; // for insurance
  fragile?: boolean;
  perishable?: boolean;
  require_signature?: boolean;
}

export interface KwikOrderRequest {
  pickup: KwikAddress;
  dropoff: KwikAddress;
  vehicle_type: KwikVehicleType;
  package: KwikPackageDetails;
  delivery_type?: "instant" | "scheduled" | "same_day";
  scheduled_time?: string; // ISO 8601
  payment_method?: "prepaid" | "cash_on_delivery" | "wallet";
  cod_amount?: number; // Cash on delivery amount
  customer_reference?: string;
  notes?: string;
  notification_settings?: {
    sms_pickup?: boolean;
    sms_dropoff?: boolean;
    email_updates?: boolean;
  };
}

export interface KwikOrderResponse {
  success: boolean;
  data?: {
    order_id: string;
    tracking_number: string;
    status: string;
    vehicle_type: KwikVehicleType;
    price: {
      subtotal: number;
      tax: number;
      total: number;
      currency: string;
    };
    estimated_pickup_time: string;
    estimated_delivery_time: string;
    driver?: {
      id: string;
      name: string;
      phone: string;
      vehicle_type: string;
      vehicle_number: string;
      rating: number;
      photo_url?: string;
      current_location?: {
        latitude: number;
        longitude: number;
        updated_at: string;
      };
    };
    qr_code?: string; // For driver verification
  };
  message?: string;
}

export interface KwikTrackingResponse {
  success: boolean;
  data?: {
    order_id: string;
    tracking_number: string;
    status:
      | "pending"
      | "searching_driver"
      | "driver_assigned"
      | "driver_arrived"
      | "picked_up"
      | "in_transit"
      | "near_destination"
      | "delivered"
      | "cancelled"
      | "failed"
      | "returned";
    status_history: Array<{
      status: string;
      timestamp: string;
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
      };
      note?: string;
      driver_id?: string;
    }>;
    current_location?: {
      latitude: number;
      longitude: number;
      address?: string;
      speed?: number;
      heading?: number;
      updated_at: string;
    };
    pickup: KwikAddress;
    dropoff: KwikAddress;
    driver?: {
      id: string;
      name: string;
      phone: string;
      vehicle_type: string;
      vehicle_number: string;
      rating: number;
      total_deliveries: number;
      photo_url?: string;
      current_location?: {
        latitude: number;
        longitude: number;
      };
    };
    timeline: {
      pickup_scheduled: string;
      pickup_actual?: string;
      delivery_scheduled: string;
      delivery_actual?: string;
      delivery_deadline: string;
    };
    proof_of_delivery?: {
      photo_url?: string;
      signature_url?: string;
      recipient_name?: string;
      recipient_phone?: string;
      notes?: string;
      timestamp: string;
    };
  };
  message?: string;
}

export interface KwikPriceEstimate {
  success: boolean;
  data?: {
    estimates: Array<{
      vehicle_type: KwikVehicleType;
      price: {
        base_fare: number;
        distance_charge: number;
        time_charge: number;
        surge_multiplier: number;
        subtotal: number;
        tax: number;
        total: number;
      };
      estimated_distance: number; // km
      estimated_duration: number; // minutes
      availability: "available" | "limited" | "unavailable";
    }>;
    currency: string;
    valid_until: string;
  };
  message?: string;
}

export interface KwikBulkOrderRequest {
  orders: Array<{
    pickup: KwikAddress;
    dropoff: KwikAddress;
    package: KwikPackageDetails;
    customer_reference?: string;
  }>;
  vehicle_type?: KwikVehicleType;
  delivery_type?: "instant" | "scheduled" | "same_day";
  scheduled_time?: string;
}

export interface KwikBulkOrderResponse {
  success: boolean;
  data?: {
    batch_id: string;
    orders: Array<{
      order_id: string;
      tracking_number: string;
      status: string;
      price: number;
    }>;
    total_price: number;
    currency: string;
  };
  message?: string;
  failed_orders?: Array<{
    index: number;
    reason: string;
  }>;
}

export interface KwikWebhookPayload {
  event:
    | "order.created"
    | "order.driver_assigned"
    | "order.driver_arrived"
    | "order.picked_up"
    | "order.in_transit"
    | "order.near_destination"
    | "order.delivered"
    | "order.cancelled"
    | "order.failed"
    | "driver.location_updated"
    | "price.updated";
  timestamp: string;
  data: {
    order_id: string;
    tracking_number: string;
    status?: string;
    previous_status?: string;
    driver?: {
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
    price?: {
      old_total?: number;
      new_total?: number;
      reason?: string;
    };
    note?: string;
  };
}

/**
 * Check if Kwik API is configured
 */
export function isKwikConfigured(): boolean {
  return !!(KWIK_API_KEY && KWIK_API_SECRET);
}

/**
 * Get API headers for Kwik requests
 */
function getKwikHeaders(): Record<string, string> {
  const auth = Buffer.from(`${KWIK_API_KEY}:${KWIK_API_SECRET}`).toString("base64");
  return {
    "Authorization": `Basic ${auth}`,
    "Content-Type": "application/json",
    "X-Environment": KWIK_MODE,
  };
}

/**
 * Create a new delivery order with Kwik
 */
export async function createKwikOrder(
  request: KwikOrderRequest
): Promise<KwikOrderResponse> {
  if (!isKwikConfigured()) {
    throw new Error("Kwik API is not configured. Please add KWIK_API_KEY and KWIK_API_SECRET to your environment variables.");
  }

  const response = await fetch(`${KWIK_API_URL}/orders`, {
    method: "POST",
    headers: getKwikHeaders(),
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create Kwik order");
  }

  return data;
}

/**
 * Create multiple orders in bulk
 */
export async function createKwikBulkOrders(
  request: KwikBulkOrderRequest
): Promise<KwikBulkOrderResponse> {
  if (!isKwikConfigured()) {
    throw new Error("Kwik API is not configured");
  }

  const response = await fetch(`${KWIK_API_URL}/orders/bulk`, {
    method: "POST",
    headers: getKwikHeaders(),
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create bulk orders");
  }

  return data;
}

/**
 * Get order details and tracking information
 */
export async function trackKwikOrder(
  trackingNumber: string
): Promise<KwikTrackingResponse> {
  if (!isKwikConfigured()) {
    throw new Error("Kwik API is not configured");
  }

  const response = await fetch(`${KWIK_API_URL}/orders/${trackingNumber}/track`, {
    method: "GET",
    headers: getKwikHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to track Kwik order");
  }

  return data;
}

/**
 * Get real-time price estimates for all vehicle types
 */
export async function getKwikPriceEstimates(
  pickup: Pick<KwikAddress, "latitude" | "longitude">,
  dropoff: Pick<KwikAddress, "latitude" | "longitude">,
  weight?: number
): Promise<KwikPriceEstimate> {
  if (!isKwikConfigured()) {
    throw new Error("Kwik API is not configured");
  }

  const response = await fetch(`${KWIK_API_URL}/pricing/estimate`, {
    method: "POST",
    headers: getKwikHeaders(),
    body: JSON.stringify({
      pickup_latitude: pickup.latitude,
      pickup_longitude: pickup.longitude,
      dropoff_latitude: dropoff.latitude,
      dropoff_longitude: dropoff.longitude,
      weight,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get price estimates");
  }

  return data;
}

/**
 * Cancel an existing order
 */
export async function cancelKwikOrder(
  trackingNumber: string,
  reason?: string
): Promise<{ success: boolean; message: string; cancellation_fee?: number }> {
  if (!isKwikConfigured()) {
    throw new Error("Kwik API is not configured");
  }

  const response = await fetch(`${KWIK_API_URL}/orders/${trackingNumber}/cancel`, {
    method: "POST",
    headers: getKwikHeaders(),
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to cancel order");
  }

  return data;
}

/**
 * Validate webhook signature from Kwik
 */
export function verifyKwikWebhookSignature(
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
 * Get available vehicle types for a route
 */
export async function getKwikVehicleTypes(
  pickup: Pick<KwikAddress, "latitude" | "longitude">,
  dropoff: Pick<KwikAddress, "latitude" | "longitude">
): Promise<KwikVehicleType[]> {
  const estimates = await getKwikPriceEstimates(pickup, dropoff);
  return (
    estimates.data?.estimates
      .filter((e) => e.availability !== "unavailable")
      .map((e) => e.vehicle_type) || []
  );
}

/**
 * Get cities where Kwik operates
 */
export async function getKwikCities(): Promise<string[]> {
  // Kwik operates in these Nigerian cities
  return [
    "Lagos",
    "Abuja",
    "Port Harcourt",
    "Ibadan",
    "Kano",
    "Benin City",
    "Enugu",
    "Onitsha",
    "Aba",
    "Calabar",
  ];
}

/**
 * Map Kwik status to our internal order status
 */
export function mapKwikStatusToOrderStatus(
  kwikStatus: string
): string {
  const statusMap: Record<string, string> = {
    "pending": "processing",
    "searching_driver": "processing",
    "driver_assigned": "processing",
    "driver_arrived": "processing",
    "picked_up": "shipped",
    "in_transit": "shipped",
    "near_destination": "out_for_delivery",
    "delivered": "delivered",
    "cancelled": "cancelled",
    "failed": "delivery_failed",
    "returned": "returned",
  };
  return statusMap[kwikStatus] || kwikStatus;
}

/**
 * Recommend best vehicle type based on package details
 */
export function recommendVehicleType(
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): KwikVehicleType {
  const volume = dimensions
    ? dimensions.length * dimensions.width * dimensions.height
    : 0;

  if (weight > 50 || volume > 1000000) {
    // > 50kg or > 1 cubic meter
    return "truck";
  } else if (weight > 20 || volume > 500000) {
    // > 20kg or > 0.5 cubic meter
    return "van";
  } else if (weight > 5 || volume > 100000) {
    // > 5kg or > 0.1 cubic meter
    return "car";
  } else if (weight <= 3) {
    return "bicycle";
  }
  return "bike";
}
