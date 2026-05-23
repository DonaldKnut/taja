"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, AlertCircle, Package, Truck } from "lucide-react";

export type StatusType = 
  | "pending" 
  | "confirmed" 
  | "processing" 
  | "shipped" 
  | "delivered" 
  | "cancelled" 
  | "refunded"
  | "active"
  | "inactive"
  | "success"
  | "error"
  | "warning"
  | "info";

export interface StatusBadgeProps {
  /**
   * Status type
   */
  status: StatusType;
  /**
   * Custom label (overrides default)
   */
  label?: string;
  /**
   * Show icon (default: true)
   */
  showIcon?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable Status Badge Component
 * 
 * Displays status badges with icons and colors for orders, accounts, etc.
 * 
 * @example
 * ```tsx
 * <StatusBadge status="delivered" />
 * <StatusBadge status="pending" label="Awaiting Payment" />
 * ```
 */
export function StatusBadge({
  status,
  label,
  showIcon = true,
  className,
  size = "md",
}: StatusBadgeProps) {
  const statusConfig: Record<
    StatusType,
    { label: string; className: string; icon?: React.ComponentType<{ className?: string }> }
  > = {
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: CheckCircle,
    },
    processing: {
      label: "Processing",
      className: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Package,
    },
    shipped: {
      label: "Shipped",
      className: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: Truck,
    },
    delivered: {
      label: "Delivered",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
    refunded: {
      label: "Refunded",
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
    },
    active: {
      label: "Active",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    inactive: {
      label: "Inactive",
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: XCircle,
    },
    success: {
      label: "Success",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    error: {
      label: "Error",
      className: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
    warning: {
      label: "Warning",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: AlertCircle,
    },
    info: {
      label: "Info",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.label;
  const Icon = showIcon ? config.icon : undefined;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {displayLabel}
    </span>
  );
}









