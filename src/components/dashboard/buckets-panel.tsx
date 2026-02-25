"use client";

import { BucketDetail } from "@/lib/types";
import { formatBytes } from "@/lib/hooks";
import {
  Database,
  ChevronDown,
  Globe,
  KeyRound,
  FileStack,
  Copy,
} from "lucide-react";
import { useState } from "react";

interface BucketsPanelProps {
  buckets: BucketDetail[];
}

const BUCKET_COLORS = [
  "#a855f7",
  "#00f0ff",
  "#39ff14",
  "#ff6b35",
  "#3b82f6",
  "#ff0055",
];

export function BucketsPanel({ buckets }: BucketsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalBytes = buckets.reduce((s, b) => s + (b.bytes ?? 0), 0);
  const totalObjects = buckets.reduce((s, b) => s + (b.objects ?? 0), 0);

  if (buckets.length === 0) {
    return (
      <div className="glass-panel glass-panel-purple animate-in stagger-5 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
            <Database className="h-3.5 w-3.5 text-neon-purple" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Buckets
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 py-10">
          <Database className="h-8 w-8 text-[#141422]" />
          <p className="text-xs text-[#5a5a80]">No buckets found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-panel-purple animate-in stagger-5 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
            <Database className="h-3.5 w-3.5 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Buckets
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              {formatBytes(totalBytes)} &middot;{" "}
              {totalObjects.toLocaleString()} objects
            </p>
          </div>
        </div>
      </div>

      {/* Bucket size visualization bar */}
      <div className="mb-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {buckets.map((b, i) => {
          const pct =
            totalBytes > 0
              ? Math.max(2, ((b.bytes ?? 0) / totalBytes) * 100)
              : 100 / buckets.length;
          return (
            <div
              key={b.id}
              className="rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor: BUCKET_COLORS[i % BUCKET_COLORS.length],
                opacity: 0.6,
                boxShadow: `0 0 8px ${BUCKET_COLORS[i % BUCKET_COLORS.length]}33`,
              }}
            />
          );
        })}
      </div>

      <div className="space-y-1.5">
        {buckets.map((bucket, i) => {
          const alias =
            bucket.globalAliases?.[0] ?? bucket.id.slice(0, 16) + "...";
          const isExpanded = expandedId === bucket.id;
          const color = BUCKET_COLORS[i % BUCKET_COLORS.length];

          return (
            <div
              key={bucket.id}
              className="glass-inner overflow-hidden rounded-xl transition-all duration-200"
            >
              <button
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#0e0e1a]"
                onClick={() =>
                  setExpandedId(isExpanded ? null : bucket.id)
                }
              >
                {/* Color dot */}
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}44`,
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {alias}
                    </span>
                    {bucket.websiteAccess && (
                      <span className="flex items-center gap-0.5 rounded-full bg-neon-cyan/10 px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.06em] text-neon-cyan ring-1 ring-neon-cyan/15">
                        <Globe className="h-2 w-2" />
                        WEB
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[#5a5a80]">
                  <span className="flex items-center gap-1">
                    <FileStack className="h-3 w-3" />
                    {(bucket.objects ?? 0).toLocaleString()}
                  </span>
                  <span className="font-medium" style={{ color }}>
                    {formatBytes(bucket.bytes ?? 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    {bucket.keys?.length ?? 0}
                  </span>
                </div>

                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-[#5a5a80] transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-[#18183033] px-4 py-3 space-y-3">
                  {/* ID */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                        Bucket ID
                      </p>
                      <p className="mt-0.5 break-all font-mono text-[11px] text-[#5a5a80]">
                        {bucket.id}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(bucket.id)
                      }
                      className="rounded-lg p-1.5 text-[#5a5a80] transition-colors hover:bg-[#141422] hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Objects",
                        value: (bucket.objects ?? 0).toLocaleString(),
                        color: "#00f0ff",
                      },
                      {
                        label: "Size",
                        value: formatBytes(bucket.bytes ?? 0),
                        color: "#a855f7",
                      },
                      {
                        label: "Pending",
                        value: (bucket.unfinishedUploads ?? 0).toString(),
                        color: "#ff6b35",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg bg-[#05050a]/80 p-2.5"
                      >
                        <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                          {s.label}
                        </p>
                        <p
                          className="mt-0.5 text-base font-bold"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Quotas */}
                  {bucket.quotas && (
                    <p className="text-[10px] text-[#5a5a80]">
                      Quotas: size{" "}
                      {bucket.quotas.maxSize
                        ? formatBytes(bucket.quotas.maxSize)
                        : "unlimited"}{" "}
                      &middot; objects{" "}
                      {bucket.quotas.maxObjects?.toLocaleString() ??
                        "unlimited"}
                    </p>
                  )}

                  {/* Keys */}
                  {bucket.keys && bucket.keys.length > 0 && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                        Access Keys
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {bucket.keys.map((k) => (
                          <div
                            key={k.accessKeyId}
                            className="flex items-center justify-between rounded-lg bg-[#05050a]/80 px-2.5 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <KeyRound className="h-3 w-3 text-neon-orange/60" />
                              <span className="text-[11px] font-medium text-foreground">
                                {k.name}
                              </span>
                              <span className="font-mono text-[9px] text-[#5a5a80]">
                                {k.accessKeyId.slice(0, 16)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {k.permissions.read && (
                                <span className="rounded bg-[#39ff14]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-green">
                                  R
                                </span>
                              )}
                              {k.permissions.write && (
                                <span className="rounded bg-[#00f0ff]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-cyan">
                                  W
                                </span>
                              )}
                              {k.permissions.owner && (
                                <span className="rounded bg-[#a855f7]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-purple">
                                  O
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
