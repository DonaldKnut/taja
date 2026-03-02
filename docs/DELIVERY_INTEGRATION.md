# 🚚 Delivery Integration Guide

This guide covers the integration of Gokada and Kwik Delivery APIs for the Taja.Shop marketplace.

## Table of Contents

1. [Overview](#overview)
2. [Gokada Integration](#gokada-integration)
3. [Kwik Delivery Integration](#kwik-delivery-integration)
4. [Configuration](#configuration)
5. [API Endpoints](#api-endpoints)
6. [Webhooks](#webhooks)
7. [Usage Examples](#usage-examples)

---

## Overview

Taja.Shop integrates with two major Nigerian delivery providers:

- **Gokada**: Premium same-day delivery in Lagos, Abuja, Ibadan, and Port Harcourt
- **Kwik Delivery**: Nationwide coverage with multiple vehicle types

### Features

- ✅ Automatic provider selection based on location
- ✅ Real-time price comparison
- ✅ Live tracking updates
- ✅ Webhook handling for status changes
- ✅ Proof of delivery with signatures/photos
- ✅ Driver information and contact
- ✅ Delivery cost calculation with platform markup

---

## Gokada Integration

### Service Areas

Gokada currently operates in:
- Lagos
- Abuja
- Ibadan
- Port Harcourt

### API Capabilities

| Feature | Status | Endpoint |
|---------|--------|----------|
| Create Order | ✅ | `POST /api/delivery` |
| Track Order | ✅ | `GET /api/delivery/track/:number` |
| Price Estimate | ✅ | `GET /api/delivery?action=prices` |
| Cancel Order | ✅ | `POST /api/delivery/cancel` |
| Webhook | ✅ | `POST /api/delivery/webhook/gokada` |

### Order Flow

1. **Order Created** → Status: `pending`
2. **Driver Assigned** → Status: `assigned`
3. **Package Picked Up** → Status: `picked_up`
4. **In Transit** → Status: `in_transit`
5. **Delivered** → Status: `delivered`

### Webhook Events

```typescript
"order.created"        // New order created
"order.assigned"       // Driver assigned
"order.picked_up"      // Package picked up
"order.in_transit"     // Delivery in progress
"order.arrived"        // Driver at destination
"order.delivered"      // Successfully delivered
"order.cancelled"      // Order cancelled
"order.failed"         // Delivery failed
"rider.location_updated" // Real-time location update
```

---

## Kwik Delivery Integration

### Service Areas

Kwik operates nationwide including:
- Lagos
- Abuja
- Port Harcourt
- Ibadan
- Kano
- Benin City
- Enugu
- Onitsha
- Aba
- Calabar

### Vehicle Types

| Type | Capacity | Best For |
|------|----------|----------|
| Bicycle | ≤3kg | Small documents, light items |
| Bike | ≤20kg | Small packages, food delivery |
| Car | ≤50kg | Medium packages, fragile items |
| Van | ≤500kg | Large items, furniture |
| Truck | >500kg | Bulk orders, heavy items |

### API Capabilities

| Feature | Status | Endpoint |
|---------|--------|----------|
| Create Order | ✅ | `POST /api/delivery` |
| Bulk Orders | ✅ | Via Kwik API |
| Track Order | ✅ | `GET /api/delivery/track/:number` |
| Price Estimates | ✅ | `GET /api/delivery?action=prices` |
| Cancel Order | ✅ | `POST /api/delivery/cancel` |
| Webhook | ✅ | `POST /api/delivery/webhook/kwik` |

### Order Flow

1. **Order Created** → Status: `pending`
2. **Searching Driver** → Status: `searching_driver`
3. **Driver Assigned** → Status: `driver_assigned`
4. **Driver Arrived** → Status: `driver_arrived`
5. **Picked Up** → Status: `picked_up`
6. **In Transit** → Status: `in_transit`
7. **Near Destination** → Status: `near_destination`
8. **Delivered** → Status: `delivered`

### Webhook Events

```typescript
"order.created"              // New order created
"order.driver_assigned"      // Driver assigned
"order.driver_arrived"       // Driver at pickup
"order.picked_up"            // Package picked up
"order.in_transit"           // Delivery in progress
"order.near_destination"     // Approaching dropoff
"order.delivered"            // Successfully delivered
"order.cancelled"            // Order cancelled
"order.failed"               // Delivery failed
"order.returned"             // Package returned
"driver.location_updated"    // Real-time location
"price.updated"              // Price adjustment (surge)
```

---

## Configuration

### Environment Variables

Add these to your `.env.local`:

```env
# Gokada Configuration
GOKADA_API_KEY=your_gokada_api_key
GOKADA_API_URL=https://api.gokada.ng/v1
GOKADA_MODE=sandbox  # or production
GOKADA_WEBHOOK_SECRET=your_webhook_secret

# Kwik Delivery Configuration
KWIK_API_KEY=your_kwik_api_key
KWIK_API_SECRET=your_kwik_api_secret
KWIK_API_URL=https://api.kwik.delivery/v2
KWIK_MODE=sandbox  # or production
KWIK_WEBHOOK_SECRET=your_webhook_secret

# Delivery Settings
DELIVERY_MARKUP_PERCENTAGE=10  # Platform markup on delivery cost
PLATFORM_FEE_PERCENTAGE=5      # Additional platform fee
```

### Getting API Keys

#### Gokada

1. Visit [Gokada Developers](https://developers.gokada.ng/)
2. Sign up for a business account
3. Submit KYC documents (CAC, ID, etc.)
4. Request API access
5. Receive API keys via email

#### Kwik Delivery

1. Visit [Kwik Delivery](https://kwik.delivery/)
2. Create a merchant account
3. Complete business verification
4. Access API credentials in dashboard
5. Configure webhook URLs

---

## API Endpoints

### Create Delivery Order

```http
POST /api/delivery
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "order_object_id",
  "provider": "auto",        // "auto", "gokada", or "kwik"
  "deliveryType": "same_day", // "instant", "same_day", "scheduled"
  "scheduledTime": "2024-01-15T14:00:00Z",
  "notes": "Fragile items, handle with care"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery order created successfully",
  "data": {
    "deliveryId": "del_123456",
    "trackingNumber": "GKD123456789",
    "provider": "gokada",
    "status": "processing",
    "estimatedDelivery": "2024-01-15T16:00:00Z",
    "price": {
      "baseCost": 1500,
      "markup": 150,
      "platformFee": 75,
      "total": 1725,
      "currency": "NGN"
    },
    "driver": {
      "name": "John Doe",
      "phone": "+2348012345678",
      "vehicleType": "bike",
      "vehicleNumber": "ABC123XYZ"
    }
  }
}
```

### Track Delivery

```http
GET /api/delivery/track/{trackingNumber}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "del_123456",
    "trackingNumber": "GKD123456789",
    "provider": "gokada",
    "status": "shipped",
    "statusHistory": [
      {
        "status": "processing",
        "timestamp": "2024-01-15T10:00:00Z",
        "note": "Order received"
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-15T11:30:00Z",
        "note": "Driver picked up package"
      }
    ],
    "currentLocation": {
      "latitude": 6.5244,
      "longitude": 3.3792,
      "address": "Lekki Phase 1, Lagos",
      "updatedAt": "2024-01-15T12:00:00Z"
    },
    "driver": {
      "name": "John Doe",
      "phone": "+2348012345678",
      "vehicleType": "bike",
      "currentLocation": {
        "latitude": 6.5244,
        "longitude": 3.3792
      }
    },
    "estimatedDeliveryTime": "2024-01-15T14:00:00Z"
  }
}
```

### Compare Delivery Prices

```http
GET /api/delivery?pickupLat=6.5244&pickupLng=3.3792&pickupCity=Lagos&dropoffLat=6.5355&dropoffLng=3.3688&dropoffCity=Lagos&weight=2
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "provider": "gokada",
      "available": true,
      "price": {
        "base": 1500,
        "markup": 150,
        "platformFee": 75,
        "total": 1725,
        "currency": "NGN"
      },
      "estimatedDuration": 45,
      "estimatedDistance": 8.5,
      "vehicleType": "bike",
      "recommended": true
    },
    {
      "provider": "kwik",
      "available": true,
      "price": {
        "base": 1800,
        "markup": 180,
        "platformFee": 90,
        "total": 2070,
        "currency": "NGN"
      },
      "estimatedDuration": 50,
      "estimatedDistance": 8.5,
      "vehicleType": "bike"
    }
  ]
}
```

### Get Serviceable Cities

```http
GET /api/delivery?action=cities
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gokada": ["Lagos", "Abuja", "Ibadan", "Port Harcourt"],
    "kwik": ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Benin City", "Enugu", "Onitsha", "Aba", "Calabar"]
  }
}
```

---

## Webhooks

### Setting Up Webhooks

Configure these URLs in your provider dashboards:

- **Gokada**: `https://yourdomain.com/api/delivery/webhook/gokada`
- **Kwik**: `https://yourdomain.com/api/delivery/webhook/kwik`

### Webhook Security

All webhooks are verified using HMAC signatures:

```typescript
// Gokada
const hash = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

// Kwik
const hash = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");
```

### Webhook Payload Structure

```json
{
  "event": "order.delivered",
  "timestamp": "2024-01-15T14:00:00Z",
  "data": {
    "order_id": "del_123456",
    "tracking_number": "GKD123456789",
    "status": "delivered",
    "driver": {
      "id": "drv_789",
      "name": "John Doe",
      "phone": "+2348012345678"
    },
    "proof_of_delivery": {
      "signature_url": "https://...",
      "photo_url": "https://...",
      "recipient_name": "Jane Smith",
      "timestamp": "2024-01-15T14:00:00Z"
    }
  }
}
```

---

## Usage Examples

### JavaScript/TypeScript Client

```typescript
import { createDeliveryOrder, trackDelivery, compareDeliveryPrices } from '@/lib/delivery';

// Create a delivery
const delivery = await createDeliveryOrder({
  pickup: {
    address: "123 Shop Street, Lagos",
    latitude: 6.5244,
    longitude: 3.3792,
    city: "Lagos",
    state: "Lagos",
    name: "My Shop",
    phone: "+2348012345678"
  },
  dropoff: {
    address: "456 Customer Ave, Lagos",
    latitude: 6.5355,
    longitude: 3.3688,
    city: "Lagos",
    state: "Lagos",
    name: "John Doe",
    phone: "+2348098765432"
  },
  package: {
    weight: 2.5,
    description: "Electronics - Phone",
    value: 50000,
    fragile: true
  },
  provider: "auto", // Auto-select best provider
  deliveryType: "same_day"
});

// Track delivery
const tracking = await trackDelivery(delivery.trackingNumber, delivery.provider);
console.log(`Status: ${tracking.status}`);
console.log(`Driver: ${tracking.driver?.name}`);

// Compare prices
const prices = await compareDeliveryPrices(
  { latitude: 6.5244, longitude: 3.3792, city: "Lagos" },
  { latitude: 6.5355, longitude: 3.3688, city: "Lagos" },
  { weight: 2 }
);

// Select cheapest option
const bestOption = prices.find(p => p.recommended);
```

### React Component

```tsx
import { useState, useEffect } from 'react';

function DeliveryTracker({ trackingNumber, provider }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      const response = await fetch(`/api/delivery/track/${trackingNumber}?provider=${provider}`);
      const data = await response.json();
      setTracking(data.data);
      setLoading(false);
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [trackingNumber, provider]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="delivery-tracker">
      <h3>Delivery Status: {tracking.status}</h3>
      {tracking.driver && (
        <div className="driver-info">
          <p>Driver: {tracking.driver.name}</p>
          <p>Phone: {tracking.driver.phone}</p>
          <p>Vehicle: {tracking.driver.vehicleType}</p>
        </div>
      )}
      {tracking.currentLocation && (
        <div className="location">
          <p>Current Location: {tracking.currentLocation.address}</p>
          <p>Last Updated: {new Date(tracking.currentLocation.updatedAt).toLocaleTimeString()}</p>
        </div>
      )}
      <div className="timeline">
        {tracking.statusHistory.map((event, index) => (
          <div key={index} className="event">
            <span>{event.status}</span>
            <span>{new Date(event.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

### Sandbox Mode

Both providers offer sandbox environments for testing:

```env
GOKADA_MODE=sandbox
KWIK_MODE=sandbox
```

### Test Tracking Numbers

Use these test tracking numbers in sandbox:

- **Gokada**: `TEST123456`, `TEST999999`
- **Kwik**: `KWIKTEST001`, `KWIKTEST002`

### Simulating Webhooks

Test webhooks locally using ngrok:

```bash
ngrok http 3000
# Use the HTTPS URL + /api/delivery/webhook/{provider}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "API not configured" | Check environment variables |
| "Invalid signature" | Verify webhook secret |
| "Location not serviceable" | Check city coverage |
| "Price estimate failed" | Verify coordinates are valid |
| "Order not found" | Check tracking number format |

### Support Contacts

- **Gokada**: developers@gokada.ng
- **Kwik**: support@kwik.delivery

---

## Next Steps

1. ✅ Obtain API keys from both providers
2. ✅ Configure environment variables
3. ✅ Set up webhook endpoints
4. ✅ Test in sandbox mode
5. ✅ Go live with production credentials
