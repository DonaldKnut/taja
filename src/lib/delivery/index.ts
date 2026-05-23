/**
 * Delivery Service Integration Hub
 * 
 * Unified interface for multiple delivery providers:
 * - Gokada (Lagos, Abuja, Ibadan, Port Harcourt)
 * - Kwik (Nationwide coverage)
 * 
 * Features:
 * - Provider selection based on location
 * - Price comparison across providers
 * - Unified tracking interface
 * - Automatic failover between providers
 */

import * as gokada from "./gokada";
import * as kwik from "./kwik";

export {
  quoteLagosDeliveryAddress,
  LAGOS_DELIVERY_ENGINE_VERSION,
} from "./lagosPartnerQuote";
export type { LagosDeliveryQuote, LagosQuoteKind } from "./lagosPartnerQuote";

export type DeliveryProvider = "gokada" | "kwik" | "auto";

export interface DeliveryAddress {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  name?: string;
  phone?: string;
  email?: string;
  instructions?: string;
}

export interface PackageDetails {
  weight: number; // kg
  dimensions?: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  description?: string;
  category?: string;
  value?: number; // Naira
  fragile?: boolean;
  perishable?: boolean;
}

export interface DeliveryOrderRequest {
  pickup: DeliveryAddress;
  dropoff: DeliveryAddress;
  package: PackageDetails;
  provider?: DeliveryProvider;
  deliveryType?: "instant" | "same_day" | "scheduled";
  scheduledTime?: Date;
  paymentMethod?: "prepaid" | "cash_on_delivery";
  customerReference?: string;
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  trackingNumber: string;
  provider: DeliveryProvider;
  status: string;
  price: {
    baseCost: number;
    markup: number;
    platformFee: number;
    total: number;
    currency: string;
  };
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  driver?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    rating?: number;
    photoUrl?: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
  pickup: DeliveryAddress;
  dropoff: DeliveryAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryTracking {
  orderId: string;
  trackingNumber: string;
  provider: DeliveryProvider;
  status: string;
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    note?: string;
  }>;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    updatedAt: Date;
  };
  driver?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    rating?: number;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  proofOfDelivery?: {
    signatureUrl?: string;
    photoUrl?: string;
    recipientName?: string;
    timestamp: Date;
  };
}

export interface PriceComparison {
  provider: DeliveryProvider;
  available: boolean;
  price: {
    base: number;
    markup: number;
    platformFee: number;
    total: number;
    currency: string;
  };
  estimatedDuration: number; // minutes
  estimatedDistance: number; // km
  vehicleType?: string;
  recommended?: boolean;
}

// Provider service areas
const GOKADA_CITIES = ["lagos", "abuja", "ibadan", "port harcourt"];

/**
 * Determine the best delivery provider based on location
 */
export function selectBestProvider(
  pickupCity: string,
  dropoffCity: string
): DeliveryProvider {
  const pickupCityLower = pickupCity.toLowerCase();
  const dropoffCityLower = dropoffCity.toLowerCase();

  // Check if both pickup and dropoff are in Gokada service area
  const gokadaAvailable =
    GOKADA_CITIES.includes(pickupCityLower) &&
    GOKADA_CITIES.includes(dropoffCityLower);

  if (gokadaAvailable) {
    // Prefer Gokada for same-city deliveries in their coverage area
    if (pickupCityLower === dropoffCityLower) {
      return "gokada";
    }
  }

  // Kwik has wider coverage, use for inter-city or non-Gokada areas
  return "kwik";
}

/**
 * Create a delivery order with the specified or auto-selected provider
 */
export async function createDeliveryOrder(
  request: DeliveryOrderRequest
): Promise<DeliveryOrder> {
  const provider = request.provider || "auto";
  const selectedProvider =
    provider === "auto"
      ? selectBestProvider(request.pickup.city, request.dropoff.city)
      : provider;

  if (selectedProvider === "gokada") {
    const response = await gokada.createGokadaOrder({
      pickup: {
        address: request.pickup.address,
        latitude: request.pickup.latitude,
        longitude: request.pickup.longitude,
        name: request.pickup.name,
        phone: request.pickup.phone,
        email: request.pickup.email,
      },
      dropoff: {
        address: request.dropoff.address,
        latitude: request.dropoff.latitude,
        longitude: request.dropoff.longitude,
        name: request.dropoff.name,
        phone: request.dropoff.phone,
        email: request.dropoff.email,
      },
      package_details: {
        weight: request.package.weight,
        size: recommendPackageSize(request.package),
        description: request.package.description,
        value: request.package.value,
        fragile: request.package.fragile,
      },
      delivery_type: request.deliveryType,
      scheduled_time: request.scheduledTime?.toISOString(),
      payment_method: request.paymentMethod,
      customer_reference: request.customerReference,
      notes: request.notes,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create Gokada order");
    }

    const costBreakdown = gokada.calculateDeliveryCostWithMarkup(
      response.data.price
    );

    return {
      id: response.data.order_id,
      trackingNumber: response.data.tracking_number,
      provider: "gokada",
      status: gokada.mapGokadaStatusToOrderStatus(response.data.status),
      price: {
        baseCost: costBreakdown.baseCost,
        markup: costBreakdown.markup,
        platformFee: costBreakdown.platformFee,
        total: costBreakdown.totalCost,
        currency: response.data.currency,
      },
      estimatedPickupTime: new Date(response.data.estimated_pickup_time),
      estimatedDeliveryTime: new Date(response.data.estimated_delivery_time),
      driver: response.data.rider
        ? {
            name: response.data.rider.name,
            phone: response.data.rider.phone,
            vehicleType: response.data.rider.vehicle_type,
            vehicleNumber: response.data.rider.vehicle_number,
            currentLocation: response.data.rider.current_location,
          }
        : undefined,
      pickup: request.pickup,
      dropoff: request.dropoff,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else {
    // Kwik
    const vehicleType = kwik.recommendVehicleType(
      request.package.weight,
      request.package.dimensions
    );

    const response = await kwik.createKwikOrder({
      pickup: {
        address: request.pickup.address,
        latitude: request.pickup.latitude,
        longitude: request.pickup.longitude,
        name: request.pickup.name,
        phone: request.pickup.phone,
        email: request.pickup.email,
        instructions: request.pickup.instructions,
      },
      dropoff: {
        address: request.dropoff.address,
        latitude: request.dropoff.latitude,
        longitude: request.dropoff.longitude,
        name: request.dropoff.name,
        phone: request.dropoff.phone,
        email: request.dropoff.email,
        instructions: request.dropoff.instructions,
      },
      vehicle_type: vehicleType,
      package: {
        weight: request.package.weight,
        dimensions: request.package.dimensions,
        description: request.package.description,
        category: request.package.category,
        value: request.package.value,
        fragile: request.package.fragile,
        perishable: request.package.perishable,
      },
      delivery_type: request.deliveryType,
      scheduled_time: request.scheduledTime?.toISOString(),
      payment_method: request.paymentMethod,
      customer_reference: request.customerReference,
      notes: request.notes,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create Kwik order");
    }

    const baseCost = response.data.price.total;
    const markup = Math.round(baseCost * 0.1); // 10% markup
    const platformFee = Math.round(baseCost * 0.05); // 5% platform fee

    return {
      id: response.data.order_id,
      trackingNumber: response.data.tracking_number,
      provider: "kwik",
      status: kwik.mapKwikStatusToOrderStatus(response.data.status),
      price: {
        baseCost,
        markup,
        platformFee,
        total: baseCost + markup + platformFee,
        currency: response.data.price.currency,
      },
      estimatedPickupTime: new Date(response.data.estimated_pickup_time),
      estimatedDeliveryTime: new Date(response.data.estimated_delivery_time),
      driver: response.data.driver
        ? {
            name: response.data.driver.name,
            phone: response.data.driver.phone,
            vehicleType: response.data.driver.vehicle_type,
            vehicleNumber: response.data.driver.vehicle_number,
            rating: response.data.driver.rating,
            photoUrl: response.data.driver.photo_url,
            currentLocation: response.data.driver.current_location,
          }
        : undefined,
      pickup: request.pickup,
      dropoff: request.dropoff,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Track a delivery order
 */
export async function trackDelivery(
  trackingNumber: string,
  provider: DeliveryProvider
): Promise<DeliveryTracking> {
  if (provider === "gokada") {
    const response = await gokada.trackGokadaOrder(trackingNumber);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to track order");
    }

    return {
      orderId: response.data.order_id,
      trackingNumber: response.data.tracking_number,
      provider: "gokada",
      status: gokada.mapGokadaStatusToOrderStatus(response.data.status),
      statusHistory: response.data.status_history.map((h) => ({
        status: gokada.mapGokadaStatusToOrderStatus(h.status),
        timestamp: new Date(h.timestamp),
        location: h.location,
        note: h.note,
      })),
      currentLocation: response.data.current_location
        ? {
            latitude: response.data.current_location.latitude,
            longitude: response.data.current_location.longitude,
            address: response.data.current_location.address,
            updatedAt: new Date(response.data.current_location.updated_at),
          }
        : undefined,
      driver: response.data.rider
        ? {
            name: response.data.rider.name,
            phone: response.data.rider.phone,
            vehicleType: response.data.rider.vehicle_type,
            vehicleNumber: response.data.rider.vehicle_number,
            rating: response.data.rider.rating,
            currentLocation: response.data.rider.current_location,
          }
        : undefined,
      estimatedDeliveryTime: response.data.estimated_delivery_time
        ? new Date(response.data.estimated_delivery_time)
        : undefined,
      actualDeliveryTime: response.data.actual_delivery_time
        ? new Date(response.data.actual_delivery_time)
        : undefined,
      proofOfDelivery: response.data.proof_of_delivery
        ? {
            signatureUrl: response.data.proof_of_delivery.signature_url,
            photoUrl: response.data.proof_of_delivery.photo_url,
            recipientName: response.data.proof_of_delivery.recipient_name,
            timestamp: new Date(response.data.proof_of_delivery.timestamp),
          }
        : undefined,
    };
  } else {
    const response = await kwik.trackKwikOrder(trackingNumber);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to track order");
    }

    return {
      orderId: response.data.order_id,
      trackingNumber: response.data.tracking_number,
      provider: "kwik",
      status: kwik.mapKwikStatusToOrderStatus(response.data.status),
      statusHistory: response.data.status_history.map((h) => ({
        status: kwik.mapKwikStatusToOrderStatus(h.status),
        timestamp: new Date(h.timestamp),
        location: h.location?.address,
        note: h.note,
      })),
      currentLocation: response.data.current_location
        ? {
            latitude: response.data.current_location.latitude,
            longitude: response.data.current_location.longitude,
            address: response.data.current_location.address,
            updatedAt: new Date(response.data.current_location.updated_at),
          }
        : undefined,
      driver: response.data.driver
        ? {
            name: response.data.driver.name,
            phone: response.data.driver.phone,
            vehicleType: response.data.driver.vehicle_type,
            vehicleNumber: response.data.driver.vehicle_number,
            rating: response.data.driver.rating,
            currentLocation: response.data.driver.current_location,
          }
        : undefined,
      estimatedDeliveryTime: response.data.timeline?.delivery_scheduled
        ? new Date(response.data.timeline.delivery_scheduled)
        : undefined,
      actualDeliveryTime: response.data.timeline?.delivery_actual
        ? new Date(response.data.timeline.delivery_actual)
        : undefined,
      proofOfDelivery: response.data.proof_of_delivery
        ? {
            signatureUrl: response.data.proof_of_delivery.signature_url,
            photoUrl: response.data.proof_of_delivery.photo_url,
            recipientName: response.data.proof_of_delivery.recipient_name,
            timestamp: new Date(response.data.proof_of_delivery.timestamp),
          }
        : undefined,
    };
  }
}

/**
 * Compare prices across all available providers
 */
export async function compareDeliveryPrices(
  pickup: Pick<DeliveryAddress, "latitude" | "longitude" | "city">,
  dropoff: Pick<DeliveryAddress, "latitude" | "longitude" | "city">,
  packageDetails: PackageDetails
): Promise<PriceComparison[]> {
  const comparisons: PriceComparison[] = [];

  // Check Gokada availability
  const gokadaAvailable =
    GOKADA_CITIES.includes(pickup.city.toLowerCase()) &&
    GOKADA_CITIES.includes(dropoff.city.toLowerCase());

  if (gokadaAvailable && gokada.isGokadaConfigured()) {
    try {
      const estimate = await gokada.getGokadaPriceEstimate(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
        packageDetails.weight,
        recommendPackageSize(packageDetails)
      );

      if (estimate.success && estimate.data) {
        const costBreakdown = gokada.calculateDeliveryCostWithMarkup(
          estimate.data.total_price
        );
        comparisons.push({
          provider: "gokada",
          available: true,
          price: {
            base: costBreakdown.baseCost,
            markup: costBreakdown.markup,
            platformFee: costBreakdown.platformFee,
            total: costBreakdown.totalCost,
            currency: estimate.data.currency,
          },
          estimatedDuration: estimate.data.estimated_duration,
          estimatedDistance: estimate.data.estimated_distance,
          vehicleType: "bike",
        });
      }
    } catch (error) {
      console.error("Failed to get Gokada estimate:", error);
    }
  }

  // Get Kwik estimates
  if (kwik.isKwikConfigured()) {
    try {
      const estimates = await kwik.getKwikPriceEstimates(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
        packageDetails.weight
      );

      if (estimates.success && estimates.data) {
        for (const estimate of estimates.data.estimates) {
          if (estimate.availability !== "unavailable") {
            const baseCost = estimate.price.total;
            const markup = Math.round(baseCost * 0.1);
            const platformFee = Math.round(baseCost * 0.05);

            comparisons.push({
              provider: "kwik",
              available: estimate.availability === "available",
              price: {
                base: baseCost,
                markup,
                platformFee,
                total: baseCost + markup + platformFee,
                currency: estimates.data.currency,
              },
              estimatedDuration: estimate.estimated_duration,
              estimatedDistance: estimate.estimated_distance,
              vehicleType: estimate.vehicle_type,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to get Kwik estimates:", error);
    }
  }

  // Mark the cheapest option as recommended
  if (comparisons.length > 0) {
    const cheapest = comparisons.reduce((min, current) =>
      current.price.total < min.price.total ? current : min
    );
    cheapest.recommended = true;
  }

  return comparisons;
}

/**
 * Cancel a delivery order
 */
export async function cancelDelivery(
  trackingNumber: string,
  provider: DeliveryProvider,
  reason?: string
): Promise<{ success: boolean; message: string; cancellationFee?: number }> {
  if (provider === "gokada") {
    const result = await gokada.cancelGokadaOrder(trackingNumber, reason);
    return {
      success: result.success,
      message: result.message,
    };
  } else {
    return await kwik.cancelKwikOrder(trackingNumber, reason);
  }
}

/**
 * Get available cities for delivery
 */
export async function getServiceableCities(): Promise<{
  gokada: string[];
  kwik: string[];
}> {
  return {
    gokada: await gokada.getGokadaCities(),
    kwik: await kwik.getKwikCities(),
  };
}

/**
 * Helper: Recommend package size based on dimensions
 */
function recommendPackageSize(
  pkg: PackageDetails
): "small" | "medium" | "large" | "xlarge" {
  if (!pkg.dimensions) return "small";

  const volume =
    pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;

  if (volume <= 1000) return "small"; // 10x10x10 cm
  if (volume <= 8000) return "medium"; // 20x20x20 cm
  if (volume <= 27000) return "large"; // 30x30x30 cm
  return "xlarge";
}

// Re-export provider-specific types and functions
export { gokada, kwik };
