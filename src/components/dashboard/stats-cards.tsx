"use client";

import {
  HealthResponse,
  StatusResponse,
  BucketDetail,
  KeyDetail,
} from "@/lib/types";
import { formatBytes } from "@/lib/hooks";
import {
  HeartPulse,
  Server,
  Database,
  KeyRound,
  HardDrive,
  Grid3X3,
} from "lucide-react";

interface StatsCardsProps {
  health: HealthResponse | null;
  status: StatusResponse | null;
  buckets: BucketDetail[];
  keys: KeyDetail[];
}

function CircleGauge({
  percent,
  color,
  size = 44,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percent, 100) / 100);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#18183066"
        strokeWidth="3"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          filter: `drop-shadow(0 0 4px ${color}66)`,
        }}
      />
    </svg>
  );
}

export function StatsCards({
  health,
  status,
  buckets,
  keys,
}: StatsCardsProps) {
  const nodes = status ? Object.values(status.nodes) : [];
  const storageNodes = nodes.filter((n) => n.capacity != null);
  const connectedNodes = nodes.filter((n) => n.isUp);
  const totalObjects = buckets.reduce((s, b) => s + (b.objects ?? 0), 0);
  const totalBytes = buckets.reduce((s, b) => s + (b.bytes ?? 0), 0);

  const partPercent =
    health && health.partitions > 0
      ? (health.partitionsAllOk / health.partitions) * 100
      : 0;
  const nodePercent =
    nodes.length > 0 ? (connectedNodes.length / nodes.length) * 100 : 0;

  const stats = [
    {
      label: "Cluster",
      value: health?.status ?? "--",
      sub: health
        ? `${health.connectedNodes}/${health.knownNodes} connected`
        : "loading...",
      icon: HeartPulse,
      color:
        health?.status === "healthy"
          ? "#39ff14"
          : health?.status === "degraded"
            ? "#ff6b35"
            : "#5a5a80",
      percent: health?.status === "healthy" ? 100 : health ? 50 : 0,
      capitalize: true,
    },
    {
      label: "Nodes",
      value: `${connectedNodes.length}/${nodes.length}`,
      sub: `${storageNodes.length} storage nodes`,
      icon: Server,
      color: "#00f0ff",
      percent: nodePercent,
    },
    {
      label: "Buckets",
      value: buckets.length.toString(),
      sub: `${totalObjects.toLocaleString()} objects total`,
      icon: Database,
      color: "#a855f7",
      percent: buckets.length > 0 ? 100 : 0,
    },
    {
      label: "Access Keys",
      value: keys.length.toString(),
      sub: "active credentials",
      icon: KeyRound,
      color: "#ff6b35",
      percent: keys.length > 0 ? 100 : 0,
    },
    {
      label: "Total Storage",
      value: formatBytes(totalBytes),
      sub: `across ${buckets.length} buckets`,
      icon: HardDrive,
      color: "#00f0ff",
      percent: totalBytes > 0 ? 75 : 0,
    },
    {
      label: "Partitions",
      value: health
        ? `${health.partitionsAllOk}/${health.partitions}`
        : "--",
      sub: health ? `${health.partitionsQuorum} at quorum` : "loading...",
      icon: Grid3X3,
      color:
        health && health.partitionsAllOk === health.partitions
          ? "#39ff14"
          : "#ff6b35",
      percent: partPercent,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`glass-panel group relative overflow-hidden rounded-2xl p-4 animate-in stagger-${i + 1}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#5a5a80]">
                {stat.label}
              </p>
              <p
                className={`mt-2 text-[22px] font-bold tracking-normal ${stat.capitalize ? "capitalize" : ""}`}
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#5a5a80]">
                {stat.sub}
              </p>
            </div>
            <div className="relative">
              <CircleGauge percent={stat.percent} color={stat.color} />
              <stat.icon
                className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                style={{ color: `${stat.color}88` }}
              />
            </div>
          </div>

          {/* Bottom gradient accent */}
          <div
            className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full opacity-[0.04] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.08]"
            style={{ backgroundColor: stat.color }}
          />
        </div>
      ))}
    </div>
  );
}
