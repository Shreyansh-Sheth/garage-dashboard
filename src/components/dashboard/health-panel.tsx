"use client";

import { HealthResponse, StatusResponse } from "@/lib/types";
import {
  HeartPulse,
  Server,
  HardDrive,
  Grid3X3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface HealthPanelProps {
  health: HealthResponse | null;
  status: StatusResponse | null;
}

function CircleGauge({
  value,
  total,
  color,
  size = 72,
}: {
  value: number;
  total: number;
  color: string;
  size?: number;
}) {
  const percent = total > 0 ? value / total : 0;
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent);
  const isOk = value === total;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#14142244"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 6px ${color}55)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {isOk ? (
          <CheckCircle2
            className="h-4 w-4"
            style={{ color }}
          />
        ) : percent >= 0.5 ? (
          <AlertTriangle className="h-4 w-4 text-neon-orange" />
        ) : (
          <XCircle className="h-4 w-4 text-neon-pink" />
        )}
      </div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ElementType;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="glass-inner flex items-center gap-3 rounded-xl p-3">
      <CircleGauge value={value} total={total} color={color} size={56} />
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3" style={{ color: `${color}88` }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#5a5a80]">
            {label}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-bold" style={{ color }}>
            {value}
          </span>
          <span className="text-xs text-[#5a5a80]">/ {total}</span>
        </div>
        <p className="text-[10px] font-medium" style={{ color: `${color}88` }}>
          {percent}%
        </p>
      </div>
    </div>
  );
}

export function HealthPanel({ health, status }: HealthPanelProps) {
  if (!health) {
    return (
      <div className="glass-panel glass-panel-green animate-in stagger-4 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-green/10">
            <HeartPulse className="h-3.5 w-3.5 text-neon-green" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Cluster Health
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 py-10">
          <div className="h-3 w-32 animate-pulse rounded-full bg-[#141422]" />
        </div>
      </div>
    );
  }

  const statusColor =
    health.status === "healthy"
      ? "#39ff14"
      : health.status === "degraded"
        ? "#ff6b35"
        : "#ff0055";

  return (
    <div className="glass-panel glass-panel-green animate-in stagger-4 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-green/10">
            <HeartPulse className="h-3.5 w-3.5 text-neon-green" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Cluster Health
          </h3>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1"
          style={{
            backgroundColor: `${statusColor}10`,
            border: `1px solid ${statusColor}22`,
          }}
        >
          <div className="relative">
            <div
              className="h-2 w-2 rounded-full neon-pulse"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}88`,
              }}
            />
          </div>
          <span
            className="text-[11px] font-semibold capitalize tracking-wide"
            style={{ color: statusColor }}
          >
            {health.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <HealthMetric
          label="Connected"
          value={health.connectedNodes}
          total={health.knownNodes}
          icon={Server}
          color="#00f0ff"
        />
        <HealthMetric
          label="Storage OK"
          value={health.storageNodesOk}
          total={health.storageNodes}
          icon={HardDrive}
          color="#a855f7"
        />
        <HealthMetric
          label="Quorum"
          value={health.partitionsQuorum}
          total={health.partitions}
          icon={Grid3X3}
          color="#ff6b35"
        />
        <HealthMetric
          label="All OK"
          value={health.partitionsAllOk}
          total={health.partitions}
          icon={Grid3X3}
          color="#39ff14"
        />
      </div>

      {/* Cluster Info */}
      {status && (
        <div className="glass-inner mt-3 rounded-xl p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
            Cluster Details
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div>
              <span className="text-[#5a5a80]">Version </span>
              <span className="font-medium text-neon-cyan">
                {status.garageVersion}
              </span>
            </div>
            <div>
              <span className="text-[#5a5a80]">DB </span>
              <span className="text-foreground">{status.dbEngine}</span>
            </div>
            <div>
              <span className="text-[#5a5a80]">Rust </span>
              <span className="text-foreground">{status.rustVersion}</span>
            </div>
            <div>
              <span className="text-[#5a5a80]">Layout </span>
              <span className="text-foreground">v{status.layoutVersion}</span>
            </div>
            {status.garageFeatures && status.garageFeatures.length > 0 && (
              <div className="col-span-2">
                <span className="text-[#5a5a80]">Features </span>
                <span className="text-neon-purple">
                  {status.garageFeatures.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
