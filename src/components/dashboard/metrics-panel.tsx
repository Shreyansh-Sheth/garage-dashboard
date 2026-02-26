"use client";

import { useApi, formatBytes } from "@/lib/hooks";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  AlertCircle,
  Loader2,
  Server,
  RefreshCw,
} from "lucide-react";

interface GarageMetrics {
  s3: {
    totalRequests: number;
    totalErrors: number;
    operations: { endpoint: string; count: number }[];
    errors: { endpoint: string; statusCode: string; count: number }[];
  };
  blockIO: {
    bytesRead: number;
    bytesWritten: number;
  };
  admin: {
    totalRequests: number;
    operations: { endpoint: string; count: number }[];
  };
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function OperationBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-[120px] truncate text-[10px] font-medium text-[#5a5a80]">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-[#141422] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(pct, 1)}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}44`,
          }}
        />
      </div>
      <span className="w-[45px] text-right font-mono text-[10px] text-foreground">
        {formatCount(count)}
      </span>
    </div>
  );
}

export function MetricsPanel({ clusterId }: { clusterId?: string }) {
  const metrics = useApi<GarageMetrics>("/api/garage/metrics", clusterId);

  if (metrics.loading && !metrics.data) {
    return (
      <div className="glass-panel animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-cyan/10">
            <Activity className="h-3.5 w-3.5 text-neon-cyan" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Cluster Metrics
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[#5a5a80]" />
          <p className="text-xs text-[#5a5a80]">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (metrics.error) {
    return (
      <div className="glass-panel animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-pink/10">
            <AlertCircle className="h-3.5 w-3.5 text-neon-pink" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Metrics Unavailable
          </h3>
        </div>
        <div className="mt-4 rounded-xl bg-[#ff0055]/5 p-3 ring-1 ring-[#ff0055]/10">
          <p className="break-all font-mono text-xs text-neon-pink/80">
            {metrics.error}
          </p>
        </div>
      </div>
    );
  }

  const data = metrics.data!;
  const topS3Ops = data.s3.operations.slice(0, 10);
  const maxS3 = topS3Ops[0]?.count ?? 1;
  const topAdminOps = data.admin.operations.slice(0, 8);
  const maxAdmin = topAdminOps[0]?.count ?? 1;
  const errorRate =
    data.s3.totalRequests > 0
      ? ((data.s3.totalErrors / data.s3.totalRequests) * 100).toFixed(2)
      : "0";

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* S3 Requests */}
        <div className="glass-panel animate-in stagger-2 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-cyan/8 ring-1 ring-neon-cyan/15">
              <BarChart3 className="h-4 w-4 text-neon-cyan" />
            </div>
            <button
              onClick={metrics.refresh}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#3a3a5a] transition-all hover:bg-[#141422] hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-foreground">
            {formatCount(data.s3.totalRequests)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#5a5a80]">
            S3 Requests
          </p>
        </div>

        {/* S3 Errors */}
        <div className="glass-panel animate-in stagger-3 rounded-2xl p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-pink/8 ring-1 ring-neon-pink/15">
            <AlertCircle className="h-4 w-4 text-neon-pink" />
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-foreground">
            {formatCount(data.s3.totalErrors)}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#5a5a80]">
              S3 Errors
            </p>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                parseFloat(errorRate) > 5
                  ? "bg-[#ff0055]/10 text-neon-pink"
                  : "bg-[#39ff14]/10 text-neon-green"
              }`}
            >
              {errorRate}%
            </span>
          </div>
        </div>

        {/* Disk Read */}
        <div className="glass-panel animate-in stagger-4 rounded-2xl p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-green/8 ring-1 ring-neon-green/15">
            <ArrowDownToLine className="h-4 w-4 text-neon-green" />
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-foreground">
            {formatBytes(data.blockIO.bytesRead)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#5a5a80]">
            Blocks Read
          </p>
        </div>

        {/* Disk Write */}
        <div className="glass-panel animate-in stagger-5 rounded-2xl p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-purple/8 ring-1 ring-neon-purple/15">
            <ArrowUpFromLine className="h-4 w-4 text-neon-purple" />
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-foreground">
            {formatBytes(data.blockIO.bytesWritten)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#5a5a80]">
            Blocks Written
          </p>
        </div>
      </div>

      {/* Operations Breakdown */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* S3 Operations */}
        <div className="glass-panel animate-in stagger-6 rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-cyan/10">
              <BarChart3 className="h-3.5 w-3.5 text-neon-cyan" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
                S3 Operations
              </h3>
              <p className="text-[10px] text-[#5a5a80]">
                Request count by endpoint
              </p>
            </div>
          </div>
          {topS3Ops.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-[#5a5a80]">
              <BarChart3 className="h-6 w-6 text-[#141422]" />
              <p className="text-xs">No S3 requests recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topS3Ops.map((op) => (
                <OperationBar
                  key={op.endpoint}
                  label={op.endpoint}
                  count={op.count}
                  max={maxS3}
                  color="#00f0ff"
                />
              ))}
            </div>
          )}
        </div>

        {/* Admin Operations + Errors */}
        <div className="space-y-4">
          {/* Admin API */}
          <div className="glass-panel animate-in stagger-7 rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3b82f6]/10">
                <Server className="h-3.5 w-3.5 text-neon-blue" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
                  Admin API
                </h3>
                <p className="text-[10px] text-[#5a5a80]">
                  {formatCount(data.admin.totalRequests)} total calls
                </p>
              </div>
            </div>
            {topAdminOps.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-[#5a5a80]">
                <Server className="h-5 w-5 text-[#141422]" />
                <p className="text-xs">No admin requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topAdminOps.map((op) => (
                  <OperationBar
                    key={op.endpoint}
                    label={op.endpoint.replace("/v2/", "")}
                    count={op.count}
                    max={maxAdmin}
                    color="#3b82f6"
                  />
                ))}
              </div>
            )}
          </div>

          {/* S3 Errors */}
          {data.s3.errors.length > 0 && (
            <div className="glass-panel glass-panel-pink animate-in stagger-8 rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-pink/10">
                  <AlertCircle className="h-3.5 w-3.5 text-neon-pink" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
                    S3 Errors
                  </h3>
                  <p className="text-[10px] text-[#5a5a80]">
                    Errors by endpoint and status code
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {data.s3.errors.slice(0, 8).map((err, i) => (
                  <div
                    key={`${err.endpoint}-${err.statusCode}-${i}`}
                    className="flex items-center gap-2 rounded-lg bg-[#05050a]/60 px-3 py-2"
                  >
                    <span className="flex-1 truncate text-[10px] font-medium text-[#5a5a80]">
                      {err.endpoint}
                    </span>
                    <span className="rounded-full bg-[#ff0055]/10 px-1.5 py-0.5 text-[8px] font-bold text-neon-pink">
                      {err.statusCode}
                    </span>
                    <span className="w-[40px] text-right font-mono text-[10px] text-foreground">
                      {formatCount(err.count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
