"use client";

import * as React from "react";

type Variant = "default" | "secondary" | "success" | "destructive";

const styles: Record<Variant, string> = {
  default: "bg-taja-primary text-white",
  secondary: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-800",
  destructive: "bg-red-100 text-red-800",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
        styles[variant] +
        (className ? " " + className : "")
      }
      {...props}
    />
  );
}

export default Badge;











