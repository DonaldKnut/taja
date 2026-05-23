"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { normalizeApiResponse, normalizeSingleItem } from "@/lib/utils/apiResponse";

interface UseApiDataOptions<T> {
  apiCall: () => Promise<any>;
  transform?: (item: any) => T;
  onError?: (error: any) => void;
  showErrorToast?: boolean;
  skip?: boolean;
}

/**
 * Reusable hook for fetching and managing API data
 * Handles loading, error states, and data transformation
 */
export function useApiData<T>({
  apiCall,
  transform,
  onError,
  showErrorToast = true,
  skip = false,
}: UseApiDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (skip) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();

      if (transform) {
        // For single item responses
        const singleItem = normalizeSingleItem(response);
        if (singleItem) {
          setData([transform(singleItem)]);
        } else {
          // For array responses
          const normalized = normalizeApiResponse(response);
          setData(normalized.data.map(transform));
        }
      } else {
        // Use default normalization
        const normalized = normalizeApiResponse<T>(response);
        setData(normalized.data);
      }
    } catch (err: any) {
      console.error("API fetch error:", err);
      const errorMessage = err?.message || "Failed to load data";
      setError(errorMessage);

      if (showErrorToast && err?.status !== 401 && err?.status !== 403) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, transform, onError, showErrorToast, skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching a single item from API
 */
export function useApiItem<T>({
  apiCall,
  transform,
  onError,
  showErrorToast = true,
  skip = false,
}: UseApiDataOptions<T>) {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (skip) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      const singleItem = normalizeSingleItem(response);

      if (singleItem) {
        setItem(transform ? transform(singleItem) : (singleItem as T));
      } else {
        setError("Item not found");
      }
    } catch (err: any) {
      console.error("API fetch error:", err);
      const errorMessage = err?.message || "Failed to load item";
      setError(errorMessage);

      if (showErrorToast && err?.status !== 401 && err?.status !== 403) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, transform, onError, showErrorToast, skip]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  return { item, loading, error, refetch: fetchItem };
}







