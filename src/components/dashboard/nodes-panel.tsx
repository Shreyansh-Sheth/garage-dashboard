"use client";

import { StatusResponse } from "@/lib/types";
import { formatBytes, timeAgo } from "@/lib/hooks";
import { Server, Wifi, WifiOff, MapPin, Tag } from "lucide-react";

interface NodesPanelProps {
  status: StatusResponse | null;
}

export function NodesPanel({ status }: NodesPanelProps) {
  if (!status) {
    return (
      <div className="glass-panel animate-in stagger-3 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <Server className="h-4 w-4 text-neon-cyan" />
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Cluster Nodes
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 py-10">
          <div className="h-3 w-40 animate-pulse rounded-full bg-[#141422]" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-[#141422]" />
        </div>
      </div>
    );
  }

  const entries = Object.entries(status.nodes);
  const onlineCount = entries.filter(([, n]) => n.isUp).length;

  return (
    <div className="glass-panel animate-in stagger-3 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-cyan/10">
            <Server className="h-3.5 w-3.5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Cluster Nodes
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              {onlineCount}/{entries.length} online &middot;{" "}
              {status.garageVersion} &middot; {status.dbEngine}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {entries.map(([nodeId, node], i) => {
          const isStorage = node.capacity != null;
          const shortId = nodeId.slice(0, 10);

          return (
            <div
              key={nodeId}
              className={`glass-inner group relative overflow-hidden rounded-xl p-3.5 transition-all duration-300 hover:border-[#28284a] animate-in stagger-${Math.min(i + 4, 8)}`}
            >
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className="relative mt-0.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      node.isUp
                        ? "bg-[#39ff14]/8 ring-1 ring-[#39ff14]/15"
                        : "bg-[#ff0055]/8 ring-1 ring-[#ff0055]/15"
                    }`}
                  >
                    {node.isUp ? (
                      <Wifi className="h-4 w-4 text-neon-green" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-neon-pink" />
                    )}
                  </div>
                  {/* Live pulse dot */}
                  <div
                    className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a14] ${
                      node.isUp ? "bg-neon-green neon-pulse" : "bg-[#ff005588]"
                    }`}
                    style={
                      node.isUp
                        ? {
                            boxShadow: "0 0 6px #39ff1488",
                          }
                        : {}
                    }
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {node.hostname || shortId}
                    </span>
                    {isStorage && (
                      <span className="rounded-full bg-[#a855f7]/10 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-neon-purple ring-1 ring-[#a855f7]/15">
                        STORAGE
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-mono text-[10px] text-[#5a5a80]">
                      {shortId}...
                    </span>
                    <span className="text-[10px] text-[#5a5a80]">
                      {node.addr}
                    </span>
                    {node.zone && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-neon-cyan/70">
                        <MapPin className="h-2.5 w-2.5" />
                        {node.zone}
                      </span>
                    )}
                    {node.tags && node.tags.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#5a5a80]">
                        <Tag className="h-2.5 w-2.5" />
                        {node.tags.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                {isStorage && node.capacity && (
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-neon-cyan">
                      {formatBytes(node.capacity)}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[#5a5a80]">
                      capacity
                    </p>
                  </div>
                )}
              </div>

              {/* Capacity bar */}
              {isStorage && node.dataPartition && (
                <div className="mt-3 rounded-lg bg-[#05050a]/60 p-2">
                  <div className="flex items-center justify-between text-[9px] text-[#5a5a80]">
                    <span>
                      {formatBytes(
                        node.dataPartition.total -
                          node.dataPartition.available,
                      )}{" "}
                      used
                    </span>
                    <span>
                      {formatBytes(node.dataPartition.available)} free
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#141422]">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.round(((node.dataPartition.total - node.dataPartition.available) / node.dataPartition.total) * 100)}%`,
                        background:
                          "linear-gradient(90deg, #00f0ff, #a855f7)",
                        boxShadow:
                          "0 0 8px rgba(0, 240, 255, 0.4)",
                      }}
                    />
                  </div>
                </div>
              )}

              {!isStorage && (
                <div className="mt-2 text-[10px] text-[#5a5a80]">
                  Last seen: {timeAgo(node.lastSeenSecsAgo)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
