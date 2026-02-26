"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export function useClusterId(): string | undefined {
  const searchParams = useSearchParams();
  return searchParams.get("cluster") ?? undefined;
}

export function buildApiUrl(
  path: string,
  clusterId?: string,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (clusterId) params.set("clusterId", clusterId);
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function useApi<T>(url: string, clusterId?: string) {
  const fullUrl = clusterId
    ? `${url}${url.includes("?") ? "&" : "?"}clusterId=${clusterId}`
    : url;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(fullUrl);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fullUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useRole(): "admin" | "readonly" | null {
  const { data } = useApi<{ role: "admin" | "readonly" | null }>("/api/auth/role");
  return data?.role ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function timeAgo(seconds: number | null): string {
  if (seconds === null) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
