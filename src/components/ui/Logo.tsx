"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TAJA_LOGO_URL } from "@/lib/brandAssets";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  variant?: "header" | "default";
}

const sizeClasses = {
  sm: { width: 120, height: 48 },
  md: { width: 160, height: 64 },
  lg: { width: 200, height: 80 },
  xl: { width: 240, height: 96 },
};

export function Logo({ className, size = "md", href = "/", variant = "default" }: LogoProps) {
  const dimensions = sizeClasses[size];
  const src = TAJA_LOGO_URL;

  const imageContent = (
    <Image
      src={src}
      alt="Taja Shop"
      width={dimensions.width}
      height={dimensions.height}
      className="object-contain"
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("flex items-center", className)}
      >
        {imageContent}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {imageContent}
    </div>
  );
}

// Alternative logo for email templates (HTML version)
export function LogoHTML({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const dimensions = sizeClasses[size];

  return (
    <img
      src={TAJA_LOGO_URL}
      alt="Taja Shop"
      width={dimensions.width}
      height={dimensions.height}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
