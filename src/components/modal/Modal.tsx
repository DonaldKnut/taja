"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "../common/IconButton";

export interface ModalProps {
  /**
   * Whether modal is open
   */
  isOpen: boolean;
  /**
   * Function to close modal
   */
  onClose: () => void;
  /**
   * Modal title
   */
  title?: string;
  /**
   * Modal description
   */
  description?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Custom className for modal
   */
  className?: string;
  /**
   * Custom className for overlay
   */
  overlayClassName?: string;
  /**
   * Modal size
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Show close button (default: true)
   */
  showCloseButton?: boolean;
  /**
   * Close on overlay click (default: true)
   */
  closeOnOverlayClick?: boolean;
}

/**
 * Reusable Modal Component
 * 
 * A modal/dialog component with overlay, title, and close functionality.
 * 
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="My Modal">
 *   <p>Modal content</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  overlayClassName,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full",
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative bg-white rounded-lg shadow-xl w-full",
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b">
              {title && (
                <div>
                  <h2 id="modal-title" className="text-xl font-semibold">
                    {title}
                  </h2>
                  {description && (
                    <p id="modal-description" className="text-sm text-gray-500 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {showCloseButton && (
                <IconButton
                  icon={X}
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  ariaLabel="Close modal"
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}









