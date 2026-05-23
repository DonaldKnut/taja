"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OrdersEmptyStateProps {
  searchTerm: string;
  statusFilter: string;
}

export function OrdersEmptyState({ searchTerm, statusFilter }: OrdersEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-[3rem] p-24 text-center border-white/60 border-dashed"
    >
      <div className="max-w-md mx-auto space-y-8">
        <div className="h-24 w-24 rounded-[2rem] bg-taja-light/30 flex items-center justify-center mx-auto mb-6 transform rotate-12 transition-transform duration-500 shadow-inner">
          <Package className="w-10 h-10 text-taja-primary opacity-40" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black text-taja-secondary tracking-tight">No orders found</h3>
          <p className="text-gray-400 font-medium text-base">
            You haven't placed any orders yet. Start shopping to find amazing pieces.
          </p>
        </div>
        {!searchTerm && statusFilter === "all" && (
          <div className="pt-4">
            <Link href="/dashboard/marketplace">
              <Button
                size="lg"
                className="rounded-full px-12 h-16 shadow-emerald hover:shadow-emerald-hover transition-all text-[11px] font-black uppercase tracking-[0.2em] transform hover:-translate-y-1"
              >
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
