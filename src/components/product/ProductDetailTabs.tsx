"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProductDetailTabsProps {
  activeTab: "description" | "specifications";
  setActiveTab: (tab: "description" | "specifications") => void;
  description?: string;
  specifications?: Record<string, any>;
  /** Tighter spacing when placed directly under the product title */
  compact?: boolean;
}

export function ProductDetailTabs({
  activeTab,
  setActiveTab,
  description,
  specifications,
  compact = false,
}: ProductDetailTabsProps) {
  return (
    <div className={cn(compact ? "space-y-4 pt-0" : "space-y-6 pt-6")}>
      <div className="flex gap-8 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("description")}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === "description" ? "text-taja-secondary border-b-2 border-taja-primary" : "text-gray-400"
          )}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab("specifications")}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === "specifications" ? "text-taja-secondary border-b-2 border-taja-primary" : "text-gray-400"
          )}
        >
          Specifications
        </button>
      </div>

      <div className="min-h-[100px]">
        {activeTab === "description" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 leading-relaxed text-sm lg:text-base italic"
          >
            {description ? `"${description}"` : "No description provided."}
          </motion.p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4"
          >
            {specifications && Object.keys(specifications).length > 0 ? (
              Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{key}</span>
                  <span className="text-sm text-taja-secondary font-black italic">{String(value)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-[10px] uppercase font-bold italic">
                No technical specifications provided for this asset.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
