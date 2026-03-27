"use client";

import { useState, useEffect, useCallback } from "react";

interface GlitchgrabReport {
  id: string;
  source: string;
  status: string;
  rawInput: string | null;
  reporterPrimaryKey: string;
  reporterName: string;
  reporterEmail: string | null;
  reporterPhone: string | null;
  pageUrl: string | null;
  createdAt: string;
  issue: {
    githubNumber: number;
    githubUrl: string;
    title: string;
    labels: string[];
    severity: string | null;
    githubState: string | null;
  } | null;
}

interface UseReportsOptions {
  /** Your Glitchgrab API token (gg_...) */
  token: string;
  /** Filter by reporter's primary key (your DB user ID) */
  userId?: string;
  /** Filter by status */
  status?: string;
  /** Max results (default 50) */
  limit?: number;
  /** Base URL (default: https://www.glitchgrab.dev) */
  baseUrl?: string;
}

interface UseReportsReturn {
  reports: GlitchgrabReport[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_BASE_URL = "https://www.glitchgrab.dev";

/**
 * Hook to fetch bug reports for a specific user.
 *
 * Usage:
 * ```tsx
 * const { reports, isLoading, error, refetch } = useGlitchgrabReports({
 *   token: process.env.NEXT_PUBLIC_GLITCHGRAB_TOKEN!,
 *   userId: session.user.id,
 * });
 * ```
 */
export function useGlitchgrabReports(
  options: UseReportsOptions
): UseReportsReturn {
  const { token, userId, status, limit = 50, baseUrl = DEFAULT_BASE_URL } = options;
  const [reports, setReports] = useState<GlitchgrabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.set("reporterPrimaryKey", userId);
      if (status) params.set("status", status);
      params.set("limit", String(limit));

      const res = await fetch(`${baseUrl}/api/v1/sdk/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setReports(data.data ?? []);
      } else {
        setError(data.error ?? "Failed to fetch reports");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [token, baseUrl, userId, status, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, isFetching, error, refetch: fetchReports };
}

/**
 * Standalone fetcher — use with TanStack Query or any data fetching library.
 *
 * Usage with TanStack Query:
 * ```tsx
 * const { data } = useQuery({
 *   queryKey: ["glitchgrab-reports", userId],
 *   queryFn: () => fetchGlitchgrabReports({
 *     token: process.env.NEXT_PUBLIC_GLITCHGRAB_TOKEN!,
 *     userId: session.user.id,
 *   }),
 * });
 * ```
 */
export async function fetchGlitchgrabReports(
  options: Omit<UseReportsOptions, "baseUrl"> & { baseUrl?: string }
): Promise<GlitchgrabReport[]> {
  const { token, userId, status, limit = 50, baseUrl = DEFAULT_BASE_URL } = options;

  const params = new URLSearchParams();
  if (userId) params.set("reporterPrimaryKey", userId);
  if (status) params.set("status", status);
  params.set("limit", String(limit));

  const res = await fetch(`${baseUrl}/api/v1/sdk/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to fetch reports");
  return data.data ?? [];
}
