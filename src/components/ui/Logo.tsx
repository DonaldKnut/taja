"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  const src = "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png";

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
      src="https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png"
      alt="Taja Shop"
      width={dimensions.width}
      height={dimensions.height}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
