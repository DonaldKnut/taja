"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface LogisticsMapProps {
  orderNumber: string;
  status: OrderStatus;
  city?: string;
  state?: string;
}

const NIGERIA_CENTER: LatLngExpression = [9.082, 8.6753];

const CITY_COORDS: Record<string, LatLngExpression> = {
  lagos: [6.5244, 3.3792],
  ikeja: [6.6018, 3.3515],
  abuja: [9.0765, 7.3986],
  "port harcourt": [4.8156, 7.0498],
  kano: [12.0022, 8.5919],
  ibadan: [7.3775, 3.9470],
  benin: [6.3382, 5.6258],
};

const ORIGIN_COORDS: LatLngExpression = [6.4654, 3.4064]; // Lagos warehouse placeholder

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  pending: 0.15,
  confirmed: 0.25,
  processing: 0.45,
  shipped: 0.75,
  delivered: 1,
  cancelled: 0,
  refunded: 0.2,
};

export function SellerLogisticsMap({ orderNumber, status, city, state }: LogisticsMapProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const destination =
    (city && CITY_COORDS[city.toLowerCase()]) ||
    (state && CITY_COORDS[state.toLowerCase()]) ||
    NIGERIA_CENTER;

  const targetProgress = STATUS_PROGRESS[status] ?? 0;

  useEffect(() => {
    let frame: number;
    const duration = 900;
    const start = performance.now();
    const startProgress = animatedProgress;

    const animate = (time: number) => {
      const elapsed = time - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startProgress + (targetProgress - startProgress) * eased;
      setAnimatedProgress(next);
      if (t < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [targetProgress]);

  const [originLat, originLng] = ORIGIN_COORDS as [number, number];
  const [destLat, destLng] = destination as [number, number];

  const currentLat = originLat + (destLat - originLat) * animatedProgress;
  const currentLng = originLng + (destLng - originLng) * animatedProgress;

  const path: LatLngExpression[] = [ORIGIN_COORDS, destination];
  const currentPosition: LatLngExpression = [currentLat, currentLng];

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <MapContainer
        center={destination as [number, number]}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={path} pathOptions={{ color: "#10B981", weight: 4, opacity: 0.7 }} />

        <Marker position={ORIGIN_COORDS as [number, number]}>
          <Tooltip offset={[0, -10]} opacity={1}>
            <div className="text-xs font-semibold">Origin warehouse</div>
          </Tooltip>
        </Marker>

        <Marker position={destination as [number, number]}>
          <Tooltip offset={[0, -10]} opacity={1}>
            <div className="text-xs font-semibold">
              Destination
              {(city || state) && (
                <span className="block font-normal">
                  {(city || state || "").toString()}
                </span>
              )}
            </div>
          </Tooltip>
        </Marker>

        {targetProgress > 0 && (
          <Marker position={currentPosition as [number, number]}>
            <Tooltip offset={[0, -10]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold">Order {orderNumber}</div>
                <div className="text-emerald-600 font-medium capitalize">
                  {status.replace(/_/g, " ")}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Approx. {(animatedProgress * 100).toFixed(0)}% of route completed
                </div>
              </div>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}








