"use client";

import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Generic confirm / alert modal that can be reused
 * for destructive actions, confirmations and info messages.
 */
export function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    const maybePromise = onConfirm();
    if (maybePromise && typeof (maybePromise as any).then === "function") {
      await maybePromise;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onCancel}
      title={title}
      description={description}
      size="sm"
      className="rounded-3xl overflow-hidden border border-slate-100 shadow-huge"
    >
      <div className="space-y-6">
        {!description && (
          <p className="text-sm text-slate-600">
            This action cannot be easily undone. Please confirm to continue.
          </p>
        )}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 hover:text-slate-900"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "destructive" : "default"}
            className="h-10 px-6 text-[11px] font-black uppercase tracking-[0.18em]"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

