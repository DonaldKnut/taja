"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Section variant (affects background)
   */
  variant?: "default" | "muted" | "primary" | "secondary";
  /**
   * Vertical padding size
   */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

/**
 * Reusable Section Component
 * 
 * Provides consistent section spacing and styling.
 * 
 * @example
 * ```tsx
 * <Section variant="muted" padding="lg">
 *   <YourContent />
 * </Section>
 * ```
 */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ variant = "default", padding = "md", className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-white",
      muted: "bg-gray-50",
      primary: "bg-taja-primary text-white",
      secondary: "bg-taja-secondary text-white",
    };

    const paddingClasses = {
      none: "",
      sm: "py-8",
      md: "py-12",
      lg: "py-16",
      xl: "py-20",
    };

    return (
      <section
        ref={ref}
        className={cn(variantClasses[variant], paddingClasses[padding], className)}
        {...props}
      />
    );
  }
);

Section.displayName = "Section";









