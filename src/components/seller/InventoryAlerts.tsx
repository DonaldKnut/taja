"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Loader2,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface InventoryAlert {
  type: 'out_of_stock' | 'low_stock' | 'overstock' | 'trending';
  productId: string;
  productName: string;
  currentStock: number;
  recommendedAction: string;
  priority: 'high' | 'medium' | 'low';
  predictedDaysUntilStockout?: number;
  recommendedReorderQuantity?: number;
  reason: string;
}

interface InventoryAlertsProps {
  sellerId?: string;
  maxAlerts?: number;
}

export function InventoryAlerts({ sellerId, maxAlerts = 5 }: InventoryAlertsProps) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await api("/api/ai/inventory");
        
        if (response?.data?.alerts) {
          setAlerts(response.data.alerts);
        }
      } catch (err: any) {
        console.error("Failed to fetch inventory alerts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [sellerId]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'overstock':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'trending':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return 'bg-red-50 border-red-200';
      case 'low_stock':
        return 'bg-amber-50 border-amber-200';
      case 'overstock':
        return 'bg-blue-50 border-blue-200';
      case 'trending':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold uppercase rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded-full">Low</span>;
      default:
        return null;
    }
  };

  const visibleAlerts = alerts
    .filter(alert => !dismissedAlerts.includes(alert.productId + alert.type))
    .slice(0, maxAlerts);

  if (loading) {
    return (
      <div className="glass-card p-6 border-white/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-taja-primary/10 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-taja-primary" />
          </div>
          <h3 className="text-sm font-black text-taja-secondary uppercase tracking-widest">AI Inventory Alerts</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border-white/60"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-taja-primary/10 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-taja-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-taja-secondary uppercase tracking-widest">AI Inventory Alerts</h3>
            <p className="text-[10px] text-gray-400">{visibleAlerts.length} items need attention</p>
          </div>
        </div>
        <Link href="/seller/products">
          <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleAlerts.map((alert, index) => (
            <motion.div
              key={alert.productId + alert.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${getAlertColor(alert.type)} relative group`}
            >
              <button
                onClick={() => dismissAlert(alert.productId + alert.type)}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-taja-secondary truncate">
                      {alert.productName}
                    </h4>
                    {getPriorityBadge(alert.priority)}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {alert.reason}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-gray-400">
                    <span>Stock: <strong className="text-taja-secondary">{alert.currentStock}</strong></span>
                    {alert.predictedDaysUntilStockout && (
                      <span>Days left: <strong className="text-red-500">{alert.predictedDaysUntilStockout}</strong></span>
                    )}
                    {alert.recommendedReorderQuantity && (
                      <span>Reorder: <strong className="text-emerald-500">{alert.recommendedReorderQuantity}</strong></span>
                    )}
                  </div>

                  <p className="text-[10px] text-taja-primary font-medium mt-2">
                    {alert.recommendedAction}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
