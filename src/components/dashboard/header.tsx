"use client";

import { useRouter } from "next/navigation";
import { HealthResponse } from "@/lib/types";
import { Zap, RefreshCw, Radio, LogOut } from "lucide-react";

interface HeaderProps {
  health: HealthResponse | null;
  onRefresh: () => void;
  loading: boolean;
}

export function Header({ health, onRefresh, loading }: HeaderProps) {
  const router = useRouter();
  const s3Endpoint = process.env.NEXT_PUBLIC_GARAGE_S3_ENDPOINT ?? "";
  const region = process.env.NEXT_PUBLIC_GARAGE_REGION ?? "garage";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const statusColor =
    health?.status === "healthy"
      ? "#39ff14"
      : health?.status === "degraded"
        ? "#ff6b35"
        : health
          ? "#ff0055"
          : "#5a5a80";

  return (
    <header className="relative z-10 flex items-center justify-between px-5 py-3">
      {/* Gradient bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#18183088] to-transparent" />

      <div className="flex items-center gap-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-neon-cyan/10 blur-md" />
            <div className="absolute inset-0 rounded-lg border border-neon-cyan/20" />
            <Zap className="relative h-4 w-4 text-neon-cyan" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-[15px] font-bold tracking-[0.12em] text-neon-cyan neon-text-cyan">
              GARAGE
            </span>
            <span className="font-heading text-[15px] font-bold tracking-[0.12em] text-neon-purple neon-text-purple">
              S3
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden h-5 w-px bg-gradient-to-b from-transparent via-[#18183066] to-transparent md:block" />

        {/* S3 Endpoint */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Radio className="h-3 w-3 text-[#5a5a80]" />
          <span className="font-mono text-[11px] tracking-wide text-[#5a5a80]">
            {s3Endpoint}
          </span>
          <span className="rounded-full bg-[#141422] px-2 py-0.5 text-[9px] font-medium tracking-[0.1em] text-[#5a5a80]">
            {region.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Cluster Health */}
        <div className="flex items-center gap-2.5 rounded-full border border-[#18183066] bg-[#0a0a14]/60 px-3.5 py-1.5 backdrop-blur-sm">
          <div className="relative">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}99`,
              }}
            />
            {health?.status === "healthy" && (
              <div
                className="status-ring absolute inset-0 rounded-full"
                style={{ color: statusColor }}
              />
            )}
          </div>
          <span
            className="text-[11px] font-medium capitalize tracking-wide"
            style={{ color: statusColor }}
          >
            {health?.status ?? "connecting"}
          </span>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="group flex h-8 w-8 items-center justify-center rounded-full border border-[#18183066] bg-[#0a0a14]/40 backdrop-blur-sm transition-all hover:border-neon-cyan/20 hover:bg-neon-cyan/5 disabled:opacity-40"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-[#5a5a80] transition-colors group-hover:text-neon-cyan ${loading ? "animate-spin" : ""}`}
          />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="group flex h-8 w-8 items-center justify-center rounded-full border border-[#18183066] bg-[#0a0a14]/40 backdrop-blur-sm transition-all hover:border-neon-pink/20 hover:bg-[#ff0055]/5"
          title="Logout"
        >
          <LogOut className="h-3.5 w-3.5 text-[#5a5a80] transition-colors group-hover:text-neon-pink" />
        </button>
      </div>
    </header>
  );
}
