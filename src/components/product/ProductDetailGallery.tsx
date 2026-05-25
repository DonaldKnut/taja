"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_IMAGE_PLACEHOLDER_URL } from "@/lib/brandAssets";
import { VideoPreviewPlayer } from "@/components/media/VideoPreviewPlayer";

interface ProductDetailGalleryProps {
  product: any;
  discountPercentage: number;
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  showMobile?: boolean;
  showDesktop?: boolean;
  isSticky?: boolean;
}

export function ProductDetailGallery({
  product,
  discountPercentage,
  selectedImageIndex,
  setSelectedImageIndex,
  showMobile = true,
  showDesktop = true,
  isSticky = false,
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
    mediaItems.length > 0 ? mediaItems : [{ type: "image" as const, src: PRODUCT_IMAGE_PLACEHOLDER_URL }];
  const activeIndex = Math.max(0, Math.min(selectedImageIndex, safeMediaItems.length - 1));
  const activeMedia = safeMediaItems[activeIndex];

  const discountBadge = discountPercentage > 0 && (
    <div className="bg-emerald-500 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 lg:px-4 lg:py-2">
      <Zap className="h-3 w-3 lg:h-4 lg:w-4 text-white fill-white animate-pulse" />
      <span className="text-[9px] lg:text-[10px] font-black tracking-widest text-white uppercase">
        {discountPercentage}% OFF
      </span>
    </div>
  );

  const navButtons =
    safeMediaItems.length > 1 ? (
      <>
        <button
          type="button"
          onClick={() =>
            setSelectedImageIndex((activeIndex - 1 + safeMediaItems.length) % safeMediaItems.length)
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/45 text-white flex items-center justify-center touch-manipulation lg:h-11 lg:w-11"
          aria-label="Previous media"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSelectedImageIndex((activeIndex + 1) % safeMediaItems.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/45 text-white flex items-center justify-center touch-manipulation lg:h-11 lg:w-11"
          aria-label="Next media"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </>
    ) : null;

  const renderMainMedia = () => {
    if (activeMedia.type === "video") {
      return (
        <VideoPreviewPlayer
          src={activeMedia.src}
          muted
          loop
          className="h-full w-full"
        />
      );
    }
    return (
      <Image src={activeMedia.src} alt={product.title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 60vw" />
    );
  };

  return (
    <>
      {showMobile && (
        <div className="lg:hidden relative aspect-square mb-4">
          <div
            className={cn(
              "w-full bg-slate-50 overflow-hidden transition-all duration-700 ease-in-out",
              isSticky
                ? "fixed top-0 left-0 right-0 h-[35vh] sm:h-[40vh] shadow-2xl border-b border-white/20 z-[10000]"
                : "relative h-full z-20"
            )}
          >
            {renderMainMedia()}
            {navButtons}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
              {discountBadge}
            </div>
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
              {renderMainMedia()}

              <div className="absolute top-8 left-8 flex flex-col gap-3 z-20 pointer-events-none">
                {discountBadge}
                <motion.div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-[10px] font-black tracking-widest text-taja-secondary uppercase shadow-lg">
                  {product.condition}
                </motion.div>
              </div>
            </motion.div>

            {safeMediaItems.length > 1 && (
              <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar pb-2">
                {safeMediaItems.map((item, index: number) => (
                  <button
                    key={index}
                    type="button"
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm border border-white/40">
                            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                          </span>
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
