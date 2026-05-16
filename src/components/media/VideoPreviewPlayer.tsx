"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoPreviewPlayerProps = {
  src: string;
  className?: string;
  videoClassName?: string;
  /** Native controls visible while video is playing */
  controlsWhenPlaying?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
};

/**
 * Product-detail style video: large centered play control in preview,
 * full-area tap target on mobile, transparent glass button on desktop.
 */
export function VideoPreviewPlayer({
  src,
  className,
  videoClassName,
  controlsWhenPlaying = true,
  muted = false,
  loop = false,
  playsInline = true,
}: VideoPreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, [src]);

  const handlePlay = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const v = videoRef.current;
      if (!v) return;
      void v.play().then(() => setIsPlaying(true)).catch(() => {});
    },
    []
  );

  return (
    <div className={cn("relative h-full w-full bg-black/5", className)}>
      <video
        ref={videoRef}
        key={src}
        src={src}
        className={cn("h-full w-full object-cover", videoClassName)}
        playsInline={playsInline}
        muted={muted}
        loop={loop}
        controls={controlsWhenPlaying && isPlaying}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {!isPlaying ? (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 z-20 flex items-center justify-center touch-manipulation"
          aria-label="Play video preview"
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full",
              "bg-white/20 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
              "min-h-[4.5rem] min-w-[4.5rem] sm:min-h-[5rem] sm:min-w-[5rem]",
              "lg:min-h-[6rem] lg:min-w-[6rem]",
              "transition-transform duration-200 active:scale-95 hover:scale-105 hover:bg-white/28"
            )}
          >
            <Play
              className="ml-1 h-10 w-10 fill-white/95 text-white sm:h-11 sm:w-11 lg:h-14 lg:w-14"
              aria-hidden
            />
          </span>
        </button>
      ) : null}
    </div>
  );
}
