"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, Clock, Eye, Package, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DashboardOrder } from "./types";

interface OrderCardProps {
  order: DashboardOrder;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "processing":
      return <Package className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "delivered":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "shipped":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "processing":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "pending":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse";
    case "cancelled":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "refunded":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="group glass-card rounded-[2.5rem] p-8 border-white/60 shadow-premium hover:shadow-premium-hover transition-all duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl -z-10 group-hover:bg-taja-primary/10 transition-colors" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${getStatusStyle(order.status)} shrink-0`}>
            {getStatusIcon(order.status)}
          </div>
          <div>
            <h3 className="text-xl font-black text-taja-secondary tracking-tight flex items-center gap-2">
              {order.orderNumber}
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-taja-primary" />
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Ordered on{" "}
              {new Date(order.date).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(order.status)}`}>
            {order.status}
          </div>
          <div className="px-4 py-1.5 rounded-full bg-taja-secondary/5 border border-taja-secondary/10 text-taja-secondary text-[9px] font-black uppercase tracking-widest shadow-sm">
            {order.paymentStatus}
          </div>
          <Link href={`/dashboard/orders/${order.id}`}>
            <Button variant="outline" size="sm" className="rounded-full border-white/60 text-[9px] h-9">
              <Eye className="w-3.5 h-3.5 mr-2" /> View
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white/30 p-3 rounded-2xl border border-white/40">
              <div className="flex-shrink-0 relative h-14 w-14 rounded-xl overflow-hidden shadow-sm">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-taja-secondary truncate uppercase tracking-wide">
                  {item.name}
                </h4>
                <p className="text-[10px] font-bold text-taja-primary mt-0.5">
                  {item.quantity} UNIT{item.quantity > 1 ? "S" : ""} • ₦{item.price.toLocaleString()}
                </p>
                <p className="text-[9px] font-medium text-gray-400">{item.seller.shop}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:pl-8 lg:border-l border-gray-100 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total Amount
                </p>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter">
                  ₦{order.total.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Destination
                </p>
                <p className="text-xs font-bold text-taja-secondary">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                  {order.shippingAddress.street}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {order.status === "delivered" && (
              <Button size="sm" variant="outline" className="rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest">
                Review Items
              </Button>
            )}
            {order.status === "shipped" && (
              <Link href={`/track/${order.orderNumber}`}>
                <Button size="sm" variant="outline" className="rounded-full h-10 px-6 text-[10px] font-black uppercase tracking-widest bg-taja-primary text-white border-none shadow-emerald">
                  Track Order
                </Button>
              </Link>
            )}
            <Link href={`/dashboard/orders/${order.id}`} className="w-full sm:w-auto">
              <Button size="sm" className="w-full rounded-full h-10 px-8 text-[10px] font-black uppercase tracking-widest shadow-premium">
                Order Details
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
