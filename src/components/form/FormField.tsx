"use client";

import * as React from "react";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  /**
   * Field label
   */
  label?: string;
  /**
   * Field label HTML for attribute
   */
  htmlFor?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Whether field is required
   */
  required?: boolean;
  /**
   * Custom className for container
   */
  className?: string;
  /**
   * Custom className for label
   */
  labelClassName?: string;
  /**
   * Children (the input/select/etc.)
   */
  children: React.ReactNode;
}

/**
 * Reusable Form Field Component
 * 
 * Wraps form inputs with label, error, and helper text.
 * 
 * @example
 * ```tsx
 * <FormField label="Email" error={errors.email} required>
 *   <Input id="email" name="email" />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  required,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500", labelClassName)}
        >
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}









