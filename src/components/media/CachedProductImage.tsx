"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCardImageUrl, getLqipImageUrl } from "@/lib/media/cdnImage";
import { prefetchImageUrl } from "@/lib/media/prefetch";

export interface CachedProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** When false, only shimmer shows (deferred until near viewport). */
  shouldLoad?: boolean;
  priority?: boolean;
  onError?: () => void;
}

/**
 * Marketplace product image: gray shimmer → blurred LQIP → sharp card thumb (fade-in).
 * Matches fast perceived load on Jiji / Jumia listing grids.
 */
export function CachedProductImage({
  src,
  alt,
  className,
  shouldLoad = true,
  priority = false,
  onError,
}: CachedProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const displaySrc = getCardImageUrl(src);
  const lqipSrc = getLqipImageUrl(src);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [displaySrc]);

  useEffect(() => {
    if (!shouldLoad || failed) return;
    prefetchImageUrl(lqipSrc, "lqip");
    if (priority) prefetchImageUrl(displaySrc, "card");
  }, [shouldLoad, failed, lqipSrc, displaySrc, priority]);

  const showImage = shouldLoad && !failed && displaySrc;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200",
          !loaded && showImage && "animate-pulse"
        )}
        style={{ opacity: loaded ? 0 : 1, transition: "opacity 0.25s ease-out" }}
      />

      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt={alt}
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              onError?.();
            }}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              className
            )}
          />
        </>
      ) : null}
    </div>
  );
}
