"use client";

import { ClusterInfo } from "@/lib/clusters";
import { NeonSelect } from "@/components/ui/neon-select";
import {
  LayoutGrid,
  Server,
  Database,
  KeyRound,
  HeartPulse,
  Plus,
  Settings,
  Map,
  FolderOpen,
  Activity,
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  clusters: ClusterInfo[];
  activeCluster: string | undefined;
  onClusterChange: (id: string) => void;
  readOnly?: boolean;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutGrid, color: "#00f0ff" },
  { id: "nodes", label: "Nodes", icon: Server, color: "#00f0ff" },
  { id: "layout", label: "Layout", icon: Map, color: "#3b82f6" },
  { id: "buckets", label: "Buckets", icon: Database, color: "#a855f7" },
  { id: "explorer", label: "Explorer", icon: FolderOpen, color: "#a855f7" },
  { id: "keys", label: "Keys", icon: KeyRound, color: "#ff6b35" },
  { id: "metrics", label: "Metrics", icon: Activity, color: "#fbbf24" },
  { id: "health", label: "Health", icon: HeartPulse, color: "#39ff14" },
  { id: "create", label: "Create", icon: Plus, color: "#00f0ff" },
];

export function Sidebar({ activeSection, onSectionChange, clusters, activeCluster, onClusterChange, readOnly }: SidebarProps) {
  const showClusterSelector = clusters.length > 1;

  const clusterOptions = clusters.map((c) => ({ value: c.id, label: c.name }));

  return (
    <aside className="relative z-10 flex w-[52px] flex-col items-center border-r border-[#18183033] py-5 lg:w-[200px] lg:items-stretch lg:px-3">
      {/* Cluster selector */}
      {showClusterSelector && (
        <div className="mb-3 px-1 lg:px-0">
          {/* Desktop */}
          <div className="hidden lg:block">
            <NeonSelect
              value={activeCluster ?? clusters[0]?.id ?? ""}
              onChange={onClusterChange}
              options={clusterOptions}
              placeholder="Select cluster..."
              color="#00f0ff"
              size="sm"
            />
          </div>
          {/* Mobile */}
          <div className="lg:hidden flex justify-center">
            <NeonSelect
              value={activeCluster ?? clusters[0]?.id ?? ""}
              onChange={onClusterChange}
              options={clusterOptions}
              placeholder="..."
              color="#00f0ff"
              size="sm"
              className="w-full"
            />
          </div>
          <div className="mt-2 mx-1 h-px bg-gradient-to-r from-transparent via-[#18183066] to-transparent" />
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.filter((item) => !readOnly || (item.id !== "layout" && item.id !== "create")).map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-white"
                  : "text-[#5a5a80] hover:text-[#8888aa]"
              }`}
            >
              {/* Active background glow */}
              {isActive && (
                <>
                  <div
                    className="absolute inset-0 rounded-xl opacity-[0.08]"
                    style={{ backgroundColor: item.color }}
                  />
                  <div
                    className="absolute inset-0 rounded-xl border opacity-20"
                    style={{ borderColor: item.color }}
                  />
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-[20%] h-[60%] w-[2px] rounded-r-full"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}88, 0 0 4px ${item.color}`,
                    }}
                  />
                </>
              )}
              <item.icon
                className="relative h-[18px] w-[18px] shrink-0 transition-all duration-200"
                style={{
                  color: isActive ? item.color : undefined,
                  filter: isActive
                    ? `drop-shadow(0 0 6px ${item.color}66)`
                    : undefined,
                }}
              />
              <span className="relative hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-0.5">
        <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-[#18183066] to-transparent" />
        <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#5a5a80] transition-all hover:text-[#8888aa]">
          <Settings className="h-[18px] w-[18px] shrink-0" />
          <span className="hidden lg:inline">Settings</span>
        </button>
      </div>
    </aside>
  );
}
