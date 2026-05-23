"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface UseFormSubmitOptions<T> {
  onSubmit: (data: T) => Promise<any>;
  onSuccess?: (response: any, data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Reusable hook for form submission
 * Handles loading state, success/error handling, and toast notifications
 */
export function useFormSubmit<T>({
  onSubmit,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
}: UseFormSubmitOptions<T>) {
  const [loading, setLoading] = useState(false);

  const submit = async (data: T) => {
    try {
      setLoading(true);
      const response = await onSubmit(data);

      if (response?.success !== false) {
        if (successMessage) {
          toast.success(successMessage);
        }
        if (onSuccess) {
          onSuccess(response, data);
        }
        return { success: true, response };
      } else {
        const errorMsg = response?.message || response?.error || errorMessage || "Operation failed";
        toast.error(errorMsg);
        if (onError) {
          onError(response);
        }
        return { success: false, error: response };
      }
    } catch (error: any) {
      console.error("Form submit error:", error);
      const errorMsg = error?.message || errorMessage || "Operation failed";
      toast.error(errorMsg);
      if (onError) {
        onError(error);
      }
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
}







