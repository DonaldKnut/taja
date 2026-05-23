"use client";

import Link from "next/link";
import { useState, useRef, useLayoutEffect, useEffect, useMemo, Fragment } from "react";
import { Play, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { buildProductMediaItems } from "@/lib/media/buildProductMediaItems";
import { prefetchProductCardMedia } from "@/lib/media/prefetch";
import { getVideoPosterUrl } from "@/lib/media/cdnImage";
import { CachedProductImage } from "@/components/media/CachedProductImage";
import type { Product } from "@/types";

const VIEWPORT_ROOT_MARGIN = "600px 0px";

let activeCardVideo: HTMLVideoElement | null = null;

export interface ProductCardMediaProps {
  product: Product;
  productPath: string;
  fallbackImage: string;
  isInsideDashboard?: boolean;
  priority?: boolean;
  onNavigateClick?: () => void;
}

export function ProductCardMedia({
  product,
  productPath,
  fallbackImage,
  isInsideDashboard = false,
  priority = false,
  onNavigateClick,
}: ProductCardMediaProps) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  const [isNearViewport, setIsNearViewport] = useState(priority);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const mediaItemsRaw = useMemo(
    () => buildProductMediaItems(product, fallbackImage),
    [product, fallbackImage]
  );
  const mediaItems = mediaItemsRaw.filter((item) => !failedMedia.has(item.src));
  const activeMedia =
    mediaItems[Math.max(0, Math.min(mediaIndex, mediaItems.length - 1))] ||
    ({ type: "image" as const, src: fallbackImage, poster: undefined });

  const images = mediaItemsRaw
    .filter((m) => m.type === "image")
    .map((m) => m.src);
  const videoPoster = getVideoPosterUrl(
    activeMedia.poster || images[0] || fallbackImage
  );

  const activeMediaType = activeMedia.type;
  const activeMediaSrc = activeMedia.src;

  useLayoutEffect(() => {
    if (priority || typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return undefined;
    }
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    let raf = 0;

    const attach = () => {
      const node = cardRef.current;
      if (!node || cancelled) return;
      observer = new IntersectionObserver(
        (entries) => setIsNearViewport(Boolean(entries[0]?.isIntersecting)),
        { root: null, rootMargin: VIEWPORT_ROOT_MARGIN, threshold: 0.01 }
      );
      observer.observe(node);
    };

    attach();
    if (!observer) {
      raf = requestAnimationFrame(() => {
        if (!cancelled) attach();
      });
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [priority]);

  useEffect(() => {
    if (!isNearViewport) return;
    prefetchProductCardMedia(mediaItemsRaw, 4);
  }, [isNearViewport, product._id, mediaItemsRaw]);

  useEffect(() => {
    setMediaIndex(0);
    setFailedMedia(new Set());
  }, [product._id]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.("change", update);
    return () => mediaQuery.removeEventListener?.("change", update);
  }, []);

  const shouldPlayActiveVideo =
    activeMediaType === "video" &&
    isNearViewport &&
    ((canHover && isHovered) || (!canHover && isTouchActive));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeMediaType !== "video") return;
    if (shouldPlayActiveVideo) {
      if (activeCardVideo && activeCardVideo !== video) {
        activeCardVideo.pause();
        activeCardVideo.currentTime = 0;
      }
      activeCardVideo = video;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      if (activeCardVideo === video) activeCardVideo = null;
    }
    return () => {
      if (activeCardVideo === video) activeCardVideo = null;
    };
  }, [shouldPlayActiveVideo, activeMediaType, activeMediaSrc]);

  const markMediaFailed = (src: string) => {
    setFailedMedia((prev) => {
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  };

  const renderMediaInner = () => {
    return (<Fragment>
      {activeMediaType === "video" && isNearViewport && !shouldPlayActiveVideo ? (
        <video
          key={`${activeMediaSrc}-prefetch`}
          src={activeMediaSrc}
          preload="auto"
          muted
          playsInline
          className="hidden"
          aria-hidden
        />
      ) : null}
      {activeMediaType === "video" && shouldPlayActiveVideo ? (
        <video
          ref={videoRef}
          key={activeMediaSrc}
          src={activeMediaSrc}
          poster={videoPoster}
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
        />
      ) : activeMediaType === "video" ? (
        <motion.div
          key={`${activeMediaSrc}-poster`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full"
        >
          {isNearViewport ? (
            <CachedProductImage
              src={activeMedia.poster || images[0] || fallbackImage}
              alt={product.title}
              shouldLoad
              priority={priority}
              className="brightness-[0.88] contrast-[1.06] transition-transform duration-700 group-hover/card:scale-110"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-gray-200" aria-hidden />
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-slate-900/35 pointer-events-none"
            aria-hidden
          />
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.25 }}
              className="rounded-full bg-black/35 backdrop-blur-[2px] p-3 sm:p-3.5 ring-2 ring-white/35 shadow-lg"
            >
              <Play className="h-7 w-7 sm:h-8 sm:w-8 text-white fill-white/90" />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <CachedProductImage
          src={activeMediaSrc}
          alt={product.title}
          shouldLoad={isNearViewport}
          priority={priority}
          onError={() => markMediaFailed(activeMediaSrc)}
          className="transition-transform duration-700 group-hover/card:scale-110"
        />
      )}
    </Fragment>);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouchActive(true)}
      onTouchEnd={() => setIsTouchActive(false)}
      onTouchCancel={() => setIsTouchActive(false)}
      className={cn(
        "relative aspect-square overflow-hidden rounded-t-2xl sm:rounded-t-[2rem]",
        activeMediaType === "video"
          ? "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"
          : "bg-gray-50"
      )}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={activeMediaSrc}
          custom={direction}
          variants={{
            initial: (d: number) => ({
              opacity: 0,
              x: d > 0 ? "12%" : d < 0 ? "-12%" : 0,
            }),
            animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
            exit: (d: number) => ({
              opacity: 0,
              x: d > 0 ? "-12%" : d < 0 ? "12%" : 0,
              transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
            }),
          }}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          {isInsideDashboard ? (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              className="block w-full h-full"
            >
              {renderMediaInner()}
            </motion.div>
          ) : (
            <Link href={productPath} onClick={onNavigateClick} className="block w-full h-full">
              {renderMediaInner()}
            </Link>
          )}
        </motion.div>
      </AnimatePresence>

      {activeMediaType === "video" && (
        <div className="absolute left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-10 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-black/60 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 pointer-events-none">
          <PlayCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="max-[360px]:hidden">Video Preview</span>
        </div>
      )}

      {mediaItems.length > 1 && (<Fragment>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDirection(-1);
              setMediaIndex((idx) => (idx - 1 + mediaItems.length) % mediaItems.length);
            }}
            className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
            aria-label="Previous media"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDirection(1);
              setMediaIndex((idx) => (idx + 1) % mediaItems.length);
            }}
            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
            aria-label="Next media"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </Fragment>)}
    </motion.div>
  );
}
