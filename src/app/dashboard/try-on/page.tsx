"use client";

import { TryOnStudio } from "@/components/virtual-tryon/TryOnStudio";
import { motion } from "framer-motion";
import { Sparkles, Layers, Wand2 } from "lucide-react";

interface TryOnPageProps {
  searchParams?: {
    image?: string;
    title?: string;
    mode?: string;
  };
}

export default function DashboardTryOnPage({ searchParams }: TryOnPageProps) {
  const initialOverlayImage = searchParams?.image;
  const initialTitle = searchParams?.title;
  const rawMode = (searchParams?.mode || "").toLowerCase();
  const initialMode =
    rawMode === "full" || rawMode === "upper" ? rawMode : undefined;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-taja-secondary tracking-tight">
            Virtual Try-On Studio
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            AI-powered fitting — see how products look on you before you buy
          </p>
        </div>
      </motion.div>

      {/* Studio Container */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <TryOnStudio
            initialOverlayImage={initialOverlayImage}
            initialTitle={initialTitle}
            initialMode={initialMode}
          />
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-10 w-10 rounded-xl bg-taja-primary/10 flex items-center justify-center text-taja-primary mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-taja-secondary mb-2">AI Body Mapping</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Our AI maps clothing to your body shape for a realistic and accurate preview.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-taja-secondary mb-2">Layer & Style</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Try on tops, dresses, or accessories — drag, resize, and rotate them freely.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
            <Wand2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-taja-secondary mb-2">Save & Buy</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Love the look? Add items to your cart and checkout instantly.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
