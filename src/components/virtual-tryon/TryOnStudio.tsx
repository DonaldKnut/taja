"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Slider } from "@/components/ui/Slider";
import {
  Camera,
  Upload as UploadIcon,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type TryOnMode = "upper" | "full";

interface OverlayItem {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TryOnStudioProps {
  initialOverlayImage?: string;
  initialTitle?: string;
  initialMode?: TryOnMode;
}

interface DragState {
  overlayId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

export function TryOnStudio({
  initialOverlayImage,
  initialTitle,
  initialMode,
}: TryOnStudioProps) {
  const [mode, setMode] = useState<TryOnMode>(initialMode || "upper");
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Seed overlay from initial product image if provided
  useEffect(() => {
    if (initialOverlayImage && overlays.length === 0) {
      setOverlays([
        {
          id: "initial-product",
          src: initialOverlayImage,
          x: 80,
          y: 60,
          scale: 1,
          rotation: 0,
        },
      ]);
      setSelectedOverlayId("initial-product");
    }
  }, [initialOverlayImage, overlays.length]);

  // Pointer move/up handlers for dragging overlays
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState || !containerRef.current) return;

      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      setOverlays((prev) =>
        prev.map((ov) =>
          ov.id === dragState.overlayId
            ? {
              ...ov,
              x: Math.min(
                rect.width - 40,
                Math.max(0, dragState.initialX + deltaX)
              ),
              y: Math.min(
                rect.height - 40,
                Math.max(0, dragState.initialY + deltaY)
              ),
            }
            : ov
        )
      );
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  const handleBaseImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBaseImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const id = `overlay-${Date.now()}`;
      setOverlays((prev) => [
        ...prev,
        {
          id,
          src: reader.result as string,
          x: 80,
          y: 80,
          scale: 1,
          rotation: 0,
        },
      ]);
      setSelectedOverlayId(id);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("Camera not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      console.error("Failed to access camera", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas =
      canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setBaseImage(dataUrl);
  };

  const handleOverlayPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    overlay: OverlayItem
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlayId(overlay.id);
    const rect = containerRef.current?.getBoundingClientRect();
    setDragState({
      overlayId: overlay.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: overlay.x,
      initialY: overlay.y,
    });
    if (rect) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const selectedOverlay = overlays.find((ov) => ov.id === selectedOverlayId) || null;

  const updateSelectedOverlay = (updates: Partial<OverlayItem>) => {
    if (!selectedOverlay) return;
    setOverlays((prev) =>
      prev.map((ov) =>
        ov.id === selectedOverlay.id ? { ...ov, ...updates } : ov
      )
    );
  };

  const removeSelectedOverlay = () => {
    if (!selectedOverlay) return;
    setOverlays((prev) => prev.filter((ov) => ov.id !== selectedOverlay.id));
    setSelectedOverlayId(null);
  };

  const clearAll = () => {
    setOverlays([]);
    setSelectedOverlayId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-taja-primary" />
            Virtual Try-On Studio
          </h2>
          <p className="text-sm text-gray-600">
            Upload or snap a photo, then drag clothing and accessories on top to see how they look
            {initialTitle ? ` with ${initialTitle}` : ""}.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant={mode === "upper" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("upper")}
          >
            Upper body
          </Button>
          <Button
            variant={mode === "full" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("full")}
          >
            Full body
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-6 md:grid-cols-[3fr,2fr]">
        {/* Canvas */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 sm:p-5">
          <div
            ref={containerRef}
            className={`relative w-full overflow-hidden rounded-lg bg-gray-200 ${mode === "upper" ? "aspect-[3/4]" : "aspect-[2/3]"
              }`}
          >
            {/* Base image or camera */}
            {baseImage ? (
              <Image
                src={baseImage}
                alt="Your photo"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            ) : cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-sm px-6">
                <Sparkles className="h-8 w-8 mb-2 text-gray-400" />
                <p className="font-medium mb-1">Start by adding your photo</p>
                <p className="text-xs text-gray-500">
                  Upload an existing picture or use your camera for a live snapshot.
                </p>
              </div>
            )}

            {/* Overlays */}
            {overlays.map((overlay) => (
              <div
                key={overlay.id}
                className={`absolute cursor-move border-2 ${overlay.id === selectedOverlayId
                    ? "border-taja-primary shadow-lg"
                    : "border-transparent"
                  } rounded-md`}
                style={{
                  left: overlay.x,
                  top: overlay.y,
                  transform: `translate(-50%, -50%) scale(${overlay.scale}) rotate(${overlay.rotation}deg)`,
                  transformOrigin: "center center",
                  touchAction: "none",
                }}
                onPointerDown={(e) => handleOverlayPointerDown(e, overlay)}
              >
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <Image
                    src={overlay.src}
                    alt="Overlay item"
                    fill
                    className="object-contain pointer-events-none select-none"
                    sizes="160px"
                  />
                </div>
              </div>
            ))}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Right panel */}
        <div className="space-y-5 p-1">
          <Tabs defaultValue="photo">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="photo">Your Photo</TabsTrigger>
              <TabsTrigger value="overlays">Layers</TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="mt-4 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Step 1 – Add your photo
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm cursor-pointer hover:border-taja-primary hover:text-taja-primary transition-colors">
                    <UploadIcon className="h-4 w-4" />
                    <span>Upload photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBaseImageUpload}
                    />
                  </label>
                  {!cameraActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Use camera
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={captureFromCamera}
                      >
                        Capture
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={stopCamera}
                      >
                        Stop camera
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  For best results in upper-body mode, frame yourself from head to waist.
                  For full-body mode, step back so we can see you head to toe.
                </p>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  View mode
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === "upper" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("upper")}
                    className="flex-1"
                  >
                    Upper body
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "full" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("full")}
                    className="flex-1"
                  >
                    Full body
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="overlays" className="mt-4 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Step 2 – Add clothing & accessories
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm cursor-pointer hover:border-taja-primary hover:text-taja-primary transition-colors">
                  <UploadIcon className="h-4 w-4" />
                  <span>Add overlay image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleOverlayUpload}
                  />
                </label>
                {initialOverlayImage && (
                  <p className="text-xs text-gray-500">
                    The current product image has been added as a layer. You can drag, resize, and rotate it.
                  </p>
                )}
              </div>

              {selectedOverlay && (
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      Selected layer
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedOverlay}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          Size
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(selectedOverlay.scale * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[selectedOverlay.scale * 100, selectedOverlay.scale * 100]}
                        max={180}
                        step={5}
                        onValueChange={([val]) =>
                          updateSelectedOverlay({ scale: val / 100 })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        Rotation
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() =>
                            updateSelectedOverlay({
                              rotation: (selectedOverlay.rotation - 10) % 360,
                            })
                          }
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {Math.round(
                            ((selectedOverlay.rotation % 360) + 360) % 360
                          )}
                          °
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {overlays.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{overlays.length} layer(s) added</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-600 font-medium"
                    onClick={clearAll}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}







