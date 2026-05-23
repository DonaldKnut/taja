"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react";
import { trackingApi } from "@/lib/api";

interface TrackingUpdate {
  status: string;
  location?: string;
  timestamp: string;
  note?: string;
}

export default function TrackingPage() {
  const params = useParams<{ trackingNumber: string }>();
  const trackingNumber = params?.trackingNumber;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!trackingNumber) return;
    try {
      setRefreshing(true);
      const response = await trackingApi.getTracking(trackingNumber);
      
      // Handle different response structures
      let trackingData;
      if (response?.data) {
        trackingData = response.data;
      } else if (response?.tracking) {
        trackingData = response.tracking;
      } else {
        trackingData = response;
      }
      
      setData(trackingData);
      setError(null);
    } catch (e: any) {
      console.error("Tracking fetch error:", e);
      setError(e?.message || "Failed to fetch tracking");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNumber]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber || "");
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-taja-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600">{error}</div>
            <Button onClick={fetchData} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updates: TrackingUpdate[] = data?.trackingUpdates || [];
  const deliveryInfo = data?.deliveryInfo;
  const latest = updates[updates.length - 1];

  const statusBadge = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-blue-600">Confirmed</Badge>;
      case "in_transit":
        return <Badge className="bg-amber-600">In Transit</Badge>;
      case "out_for_delivery":
        return <Badge className="bg-purple-600">Out for Delivery</Badge>;
      case "delivered":
        return <Badge className="bg-green-600">Delivered</Badge>;
      case "failed":
        return <Badge className="bg-red-600">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Delivery Tracking</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Tracking No.
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="text-sm text-gray-600">Tracking Number</div>
            <div className="text-gray-900 font-medium">{trackingNumber}</div>
            {statusBadge(latest?.status || deliveryInfo?.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Provider</div>
              <div className="flex items-center gap-2 text-gray-900">
                <Truck className="h-4 w-4" /> {deliveryInfo?.provider || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Estimated Delivery</div>
              <div className="flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4" />
                {deliveryInfo?.estimatedDelivery
                  ? new Date(deliveryInfo.estimatedDelivery).toLocaleString()
                  : "-"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Current Location</div>
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin className="h-4 w-4" />
                {deliveryInfo?.currentLocation || latest?.location || "-"}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm text-gray-600 mb-3">Timeline</div>
            <div className="space-y-4">
              {updates.length === 0 && (
                <div className="text-gray-500 text-sm">No updates yet.</div>
              )}
              {updates.map((u, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {u.status.toLowerCase() === "delivered" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {u.status.replaceAll("_", " ")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(u.timestamp).toLocaleString()}
                      {u.location ? ` • ${u.location}` : ""}
                    </div>
                    {u.note && (
                      <div className="text-sm text-gray-700 mt-1">{u.note}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









