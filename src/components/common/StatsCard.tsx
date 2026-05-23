"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-emerald-600",
  iconBgColor = "bg-emerald-100",
  trend,
  className = "",
}: StatsCardProps) {
  const formattedValue = typeof value === "number" && value >= 1000
    ? `₦${(value / 1000).toFixed(1)}k`
    : typeof value === "number"
    ? `₦${value.toLocaleString()}`
    : value;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formattedValue}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trend.isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}







