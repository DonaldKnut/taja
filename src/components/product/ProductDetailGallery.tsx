"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PlayCircle, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductDetailGalleryProps {
  product: any;
  discountPercentage: number;
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  showMobile?: boolean;
  showDesktop?: boolean;
}

export function ProductDetailGallery({
  product,
  discountPercentage,
  selectedImageIndex,
  setSelectedImageIndex,
  showMobile = true,
  showDesktop = true,
}: ProductDetailGalleryProps) {
  const normalizedVideos = Array.isArray(product?.videos)
    ? product.videos
        .map((v: any) => (typeof v === "string" ? v : v?.url))
        .filter((url: string) => typeof url === "string" && url.trim().length > 0)
        .slice(0, 2)
    : [];
  const normalizedImages = Array.isArray(product?.images) ? product.images : [];
  const mediaItems: Array<{ type: "video" | "image"; src: string }> = [
    ...normalizedVideos.map((src: string) => ({ type: "video" as const, src })),
    ...normalizedImages.map((src: string) => ({ type: "image" as const, src })),
  ];
  const safeMediaItems =
    mediaItems.length > 0 ? mediaItems : [{ type: "image" as const, src: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png" }];
  const activeIndex = Math.max(0, Math.min(selectedImageIndex, safeMediaItems.length - 1));
  const activeMedia = safeMediaItems[activeIndex];

  return (
    <>
      {showMobile && (
        <div className="lg:hidden sticky top-12 sm:top-16 z-20 w-full relative aspect-square bg-slate-50 overflow-hidden">
          {activeMedia.type === "video" ? (
            <video
              key={activeMedia.src}
              src={activeMedia.src}
              controls
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <Image src={activeMedia.src} alt={product.title} fill className="object-cover" />
          )}
          {activeMedia.type === "video" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-black/55 border border-white/70 shadow-2xl flex items-center justify-center animate-pulse">
                <PlayCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
          )}
          {safeMediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSelectedImageIndex((activeIndex - 1 + safeMediaItems.length) % safeMediaItems.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/45 text-white flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedImageIndex((activeIndex + 1) % safeMediaItems.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/45 text-white flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {discountPercentage > 0 && (
              <div className="bg-emerald-500 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-white fill-white" />
                <span className="text-[9px] font-black tracking-widest text-white uppercase">
                  {discountPercentage}% OFF
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {showDesktop && (
        <div className="hidden lg:block lg:col-span-7 space-y-8">
          <div className="sticky top-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative aspect-[4/5] bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/5"
            >
              {activeMedia.type === "video" ? (
                <video
                  key={activeMedia.src}
                  src={activeMedia.src}
                  controls
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={activeMedia.src}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              )}

              <div className="absolute top-8 left-8 flex flex-col gap-3">
                {discountPercentage > 0 && (
                  <div className="bg-emerald-500 px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                    <Zap className="h-4 w-4 text-white fill-white animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">
                      {discountPercentage}% OFF
                    </span>
                  </div>
                )}
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-[10px] font-black tracking-widest text-taja-secondary uppercase shadow-lg">
                  {product.condition}
                </div>
              </div>
            </motion.div>

            {safeMediaItems.length > 1 && (
              <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar pb-2">
                {safeMediaItems.map((item, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all duration-500",
                      selectedImageIndex === index
                        ? "border-emerald-500 scale-105 shadow-xl rotate-0"
                        : "border-transparent opacity-60 hover:opacity-100 -rotate-2"
                    )}
                  >
                    {item.type === "video" ? (
                      <div className="relative w-full h-full bg-black">
                        <video src={item.src} muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <PlayCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <Image src={item.src} alt="" fill className="object-cover" sizes="96px" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
