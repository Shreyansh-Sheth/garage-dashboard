"use client";

import { KeyDetail } from "@/lib/types";
import {
  KeyRound,
  ChevronDown,
  Database,
  Shield,
  Copy,
} from "lucide-react";
import { useState } from "react";

interface KeysPanelProps {
  keys: KeyDetail[];
}

export function KeysPanel({ keys }: KeysPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (keys.length === 0) {
    return (
      <div className="glass-panel glass-panel-orange animate-in stagger-6 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-orange/10">
            <KeyRound className="h-3.5 w-3.5 text-neon-orange" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Access Keys
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 py-10">
          <KeyRound className="h-8 w-8 text-[#141422]" />
          <p className="text-xs text-[#5a5a80]">No keys found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-panel-orange animate-in stagger-6 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-orange/10">
            <KeyRound className="h-3.5 w-3.5 text-neon-orange" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Access Keys
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              {keys.length} active credentials
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {keys.map((key) => {
          const isExpanded = expandedId === key.accessKeyId;
          const bucketCount = key.buckets?.length ?? 0;

          return (
            <div
              key={key.accessKeyId}
              className="glass-inner overflow-hidden rounded-xl transition-all duration-200"
            >
              <button
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#0e0e1a]"
                onClick={() =>
                  setExpandedId(isExpanded ? null : key.accessKeyId)
                }
              >
                {/* Key icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-orange/8 ring-1 ring-neon-orange/15">
                  <KeyRound className="h-3.5 w-3.5 text-neon-orange/70" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      {key.name}
                    </span>
                    {key.permissions.createBucket && (
                      <span className="flex items-center gap-0.5 rounded-full bg-[#a855f7]/10 px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.06em] text-neon-purple ring-1 ring-[#a855f7]/15">
                        <Shield className="h-2 w-2" />
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-[#5a5a80]">
                    {key.accessKeyId}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#5a5a80]">
                  <Database className="h-3 w-3" />
                  <span>
                    {bucketCount} bucket{bucketCount !== 1 ? "s" : ""}
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
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                        Access Key ID
                      </p>
                      <p className="mt-0.5 break-all font-mono text-[11px] text-neon-cyan">
                        {key.accessKeyId}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(key.accessKeyId)
                      }
                      className="rounded-lg p-1.5 text-[#5a5a80] transition-colors hover:bg-[#141422] hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  {key.buckets && key.buckets.length > 0 ? (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                        Bucket Access
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {key.buckets.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between rounded-lg bg-[#05050a]/80 px-2.5 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="h-3 w-3 text-neon-purple/60" />
                              <span className="text-[11px] font-medium text-foreground">
                                {b.globalAliases?.[0] ?? b.id.slice(0, 16)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {b.permissions.read && (
                                <span className="rounded bg-[#39ff14]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-green">
                                  READ
                                </span>
                              )}
                              {b.permissions.write && (
                                <span className="rounded bg-[#00f0ff]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-cyan">
                                  WRITE
                                </span>
                              )}
                              {b.permissions.owner && (
                                <span className="rounded bg-[#a855f7]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-purple">
                                  OWNER
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#5a5a80]">
                      No bucket access configured
                    </p>
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
