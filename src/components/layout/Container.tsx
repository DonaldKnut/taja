"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Container size variant
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Whether container has padding (default: true)
   */
  padding?: boolean;
}

/**
 * Reusable Container Component
 * 
 * Provides consistent container widths and padding across the app.
 * 
 * @example
 * ```tsx
 * <Container size="lg" padding>
 *   <YourContent />
 * </Container>
 * ```
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = "lg", padding = true, className, ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-[90rem]",
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          sizeClasses[size],
          padding && "px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";









