"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { ImageSlider } from "@/components/ui/ImageSlider";
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
  return (
    <>
      {showMobile && (
        <div className="lg:hidden w-full relative aspect-square bg-slate-50 overflow-hidden">
          <ImageSlider images={product.images} alt={product.title} className="w-full h-full" showDots />
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
              <Image
                src={product.images[selectedImageIndex]}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

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

            {product.images.length > 1 && (
              <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar pb-2">
                {product.images.map((image: string, index: number) => (
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
                    <Image src={image} alt="" fill className="object-cover" sizes="96px" />
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
