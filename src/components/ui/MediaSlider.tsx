"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Flag,
  MoreHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  thumbnail?: string;
  duration?: number;
  alt?: string;
}

interface MediaSliderProps {
  media: MediaItem[];
  className?: string;
  showControls?: boolean;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  showFullscreen?: boolean;
  showDownload?: boolean;
  showShare?: boolean;
  showLike?: boolean;
  showComment?: boolean;
  onLike?: (mediaId: string) => void;
  onComment?: (mediaId: string) => void;
  onShare?: (mediaId: string) => void;
  onDownload?: (mediaId: string) => void;
  onFullscreen?: (mediaId: string) => void;
  onMediaChange?: (index: number) => void;
}

export function MediaSlider({
  media,
  className,
  showControls = true,
  showThumbnails = true,
  autoPlay = false,
  loop = true,
  showFullscreen = true,
  showDownload = true,
  showShare = true,
  showLike = true,
  showComment = true,
  onLike,
  onComment,
  onShare,
  onDownload,
  onFullscreen,
  onMediaChange,
}: MediaSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentMedia = media[currentIndex];

  useEffect(() => {
    if (autoPlay && currentMedia?.type === "video") {
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.play();
        setIsPlaying(true);
      }
    }
  }, [currentIndex, autoPlay, currentMedia?.type]);

  useEffect(() => {
    if (isPlaying && currentMedia?.type === "video") {
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.play();
      }
    } else if (!isPlaying && currentMedia?.type === "video") {
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.pause();
      }
    }
  }, [isPlaying, currentIndex, currentMedia?.type]);

  useEffect(() => {
    onMediaChange?.(currentIndex);
  }, [currentIndex, onMediaChange]);

  const nextSlide = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (loop) {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (loop) {
      setCurrentIndex(media.length - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    if (currentMedia?.type === "video") {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (currentMedia?.type === "video") {
      const video = videoRefs.current[currentIndex];
      if (video) {
        video.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
  };

  const handleVideoLoadStart = () => {
    setIsLoading(true);
  };

  const handleFullscreen = () => {
    if (currentMedia) {
      onFullscreen?.(currentMedia.id);
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleDownload = () => {
    if (currentMedia) {
      onDownload?.(currentMedia.id);
    }
  };

  const handleShare = () => {
    if (currentMedia) {
      onShare?.(currentMedia.id);
    }
  };

  const handleLike = () => {
    if (currentMedia) {
      onLike?.(currentMedia.id);
    }
  };

  const handleComment = () => {
    if (currentMedia) {
      onComment?.(currentMedia.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        prevSlide();
        break;
      case "ArrowRight":
        nextSlide();
        break;
      case " ":
        e.preventDefault();
        togglePlayPause();
        break;
      case "f":
        handleFullscreen();
        break;
      case "Escape":
        setIsFullscreen(false);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isPlaying, isFullscreen]);

  if (!media || media.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 rounded-lg",
          className
        )}
      >
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl">📷</span>
          </div>
          <p>No media available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Main Media Display */}
      <div
        ref={containerRef}
        className="relative aspect-square md:aspect-video bg-black rounded-lg overflow-hidden"
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        {currentMedia?.type === "image" ? (
          <div className="relative w-full h-full">
            <Image
              src={currentMedia.url}
              alt={currentMedia.alt || "Product image"}
              fill
              className="object-cover"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
              }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={(el) => {
                videoRefs.current[currentIndex] = el as HTMLVideoElement | null;
              }}
              src={currentMedia.url}
              poster={currentMedia.thumbnail}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop={loop}
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              onLoadStart={handleVideoLoadStart}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            {/* Video Duration Badge */}
            {currentMedia.duration && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(currentMedia.duration)}
              </div>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevSlide}
              disabled={!loop && currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextSlide}
              disabled={!loop && currentIndex === media.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Overlay Controls */}
        {(showOverlay || isFullscreen) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50 flex flex-col justify-between p-4">
            {/* Top Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-medium">
                  {currentIndex + 1} / {media.length}
                </span>
                {currentMedia?.type === "video" && (
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {showFullscreen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleFullscreen}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                {showDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {showShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {showLike && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleLike}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
                {showComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleComment}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Image Controls */}
              {currentMedia?.type === "image" && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setRotation(rotation - 90)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setRotation(rotation + 90)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Play Button for Videos */}
        {currentMedia?.type === "video" && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-black bg-opacity-50 hover:bg-opacity-75 text-white"
              onClick={togglePlayPause}
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {showThumbnails && media.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-taja-primary ring-2 ring-taja-primary/20"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => goToSlide(index)}
            >
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={item.alt || "Thumbnail"}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full bg-gray-100">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt="Video thumbnail"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Play className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1">
                    {item.duration ? formatDuration(item.duration) : "VID"}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Dots Indicator */}
      {!showThumbnails && media.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {media.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentIndex === index
                  ? "bg-taja-primary"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


