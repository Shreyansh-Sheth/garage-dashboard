"use client";

import { useState, FormEvent } from "react";
import { useApi, formatBytes, buildApiUrl } from "@/lib/hooks";
import { NeonSelect } from "@/components/ui/neon-select";
import { LayoutResponse, StatusResponse, NodeRole } from "@/lib/types";
import {
  Map,
  Server,
  MapPin,
  Tag,
  HardDrive,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Undo2,
  Rocket,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Link,
  Copy,
  Check,
  Disc3,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface LayoutCreatorProps {
  status: StatusResponse | null;
  onStatusRefresh?: () => void;
  clusterId?: string;
}

const ZONE_COLORS = [
  "#00f0ff",
  "#a855f7",
  "#39ff14",
  "#ff6b35",
  "#3b82f6",
  "#ff0055",
  "#fbbf24",
  "#ec4899",
];

function getZoneColor(zone: string, allZones: string[]): string {
  const idx = allZones.indexOf(zone);
  return ZONE_COLORS[idx >= 0 ? idx % ZONE_COLORS.length : 0];
}

function StatusMessage({
  status,
}: {
  status: { type: "success" | "error"; message: string } | null;
}) {
  if (!status) return null;
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs ${
        status.type === "success"
          ? "bg-[#39ff14]/8 text-neon-green ring-1 ring-[#39ff14]/15"
          : "bg-[#ff0055]/8 text-neon-pink ring-1 ring-[#ff0055]/15"
      }`}
    >
      {status.type === "success" ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0" />
      )}
      {status.message}
    </div>
  );
}

function parseCapacity(input: string): number | null {
  const s = input.trim().toUpperCase();
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB)?$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2] || "B";
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
  };
  return Math.round(num * (multipliers[unit] ?? 1));
}

/* ── Zone Topology View ── */
function ZoneTopology({
  layout,
  status,
  allZones,
}: {
  layout: LayoutResponse;
  status: StatusResponse | null;
  allZones: string[];
}) {
  // Group nodes by zone
  const zoneMap: globalThis.Map<string, { nodeId: string; role: NodeRole }[]> = new globalThis.Map();
  const unassigned: string[] = [];

  // Current layout roles
  for (const [nodeId, role] of Object.entries(layout.roles)) {
    const zone = role.zone;
    if (!zoneMap.has(zone)) zoneMap.set(zone, []);
    zoneMap.get(zone)!.push({ nodeId, role });
  }

  // Find unassigned nodes from status
  if (status) {
    for (const nodeId of Object.keys(status.nodes)) {
      if (!layout.roles[nodeId]) {
        unassigned.push(nodeId);
      }
    }
  }

  const stagedCount = Object.keys(layout.stagedRoleChanges).length;

  return (
    <div className="glass-panel animate-in stagger-2 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-cyan/10">
            <Layers className="h-3.5 w-3.5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Cluster Topology
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              Layout v{layout.version} &middot; {Object.keys(layout.roles).length} assigned nodes
              {stagedCount > 0 && (
                <span className="ml-1 text-neon-orange">
                  &middot; {stagedCount} staged
                </span>
              )}
            </p>
          </div>
        </div>
        {/* Zone legend */}
        <div className="flex flex-wrap gap-2">
          {allZones.map((zone) => (
            <div key={zone} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: getZoneColor(zone, allZones),
                  boxShadow: `0 0 4px ${getZoneColor(zone, allZones)}44`,
                }}
              />
              <span className="text-[10px] text-[#5a5a80]">{zone}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone containers */}
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from(zoneMap.entries()).map(([zone, nodes]) => {
          const color = getZoneColor(zone, allZones);
          const totalCap = nodes.reduce((s, n) => s + n.role.capacity, 0);

          return (
            <div
              key={zone}
              className="relative overflow-hidden rounded-xl p-3"
              style={{
                backgroundColor: `${color}06`,
                border: `1px solid ${color}18`,
              }}
            >
              {/* Zone header */}
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" style={{ color }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.1em]"
                    style={{ color }}
                  >
                    {zone}
                  </span>
                </div>
                <span className="text-[10px] text-[#5a5a80]">
                  {nodes.length} node{nodes.length !== 1 ? "s" : ""} &middot;{" "}
                  {formatBytes(totalCap)}
                </span>
              </div>

              {/* Nodes in zone */}
              <div className="space-y-1.5">
                {nodes.map(({ nodeId, role }) => {
                  const hostname =
                    status?.nodes[nodeId]?.hostname || nodeId.slice(0, 10);
                  const isUp = status?.nodes[nodeId]?.isUp ?? false;
                  const staged = layout.stagedRoleChanges[nodeId];
                  const isBeingRemoved = staged === null;
                  const isBeingModified =
                    staged !== undefined && staged !== null;

                  return (
                    <div
                      key={nodeId}
                      className={`flex items-center gap-2.5 rounded-lg bg-[#05050a]/60 p-2.5 transition-all ${
                        isBeingRemoved
                          ? "opacity-50 line-through"
                          : isBeingModified
                            ? "ring-1 ring-neon-orange/30"
                            : ""
                      }`}
                    >
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${isUp ? "neon-pulse" : ""}`}
                        style={{
                          backgroundColor: isUp ? "#39ff14" : "#ff005588",
                          boxShadow: isUp ? "0 0 4px #39ff1466" : "none",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-[11px] font-medium text-foreground">
                          {hostname}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium" style={{ color }}>
                        {formatBytes(role.capacity)}
                      </span>
                      {role.tags.length > 0 && (
                        <div className="flex gap-0.5">
                          {role.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-[#141422] px-1 py-0.5 text-[8px] text-[#5a5a80]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {isBeingModified && (
                        <ArrowRight className="h-3 w-3 shrink-0 text-neon-orange" />
                      )}
                      {isBeingRemoved && (
                        <Trash2 className="h-3 w-3 shrink-0 text-neon-pink/60" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gradient accent */}
              <div
                className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-[0.03] blur-2xl"
                style={{ backgroundColor: color }}
              />
            </div>
          );
        })}

        {/* Unassigned nodes */}
        {unassigned.length > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-dashed border-[#18183066] p-3">
            <div className="mb-2.5 flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-[#5a5a80]" />
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                Unassigned
              </span>
            </div>
            <div className="space-y-1.5">
              {unassigned.map((nodeId) => {
                const hostname =
                  status?.nodes[nodeId]?.hostname || nodeId.slice(0, 10);
                const isUp = status?.nodes[nodeId]?.isUp ?? false;
                const staged = layout.stagedRoleChanges[nodeId];
                const isBeingAdded = staged !== undefined && staged !== null;

                return (
                  <div
                    key={nodeId}
                    className={`flex items-center gap-2.5 rounded-lg bg-[#05050a]/60 p-2.5 ${
                      isBeingAdded ? "ring-1 ring-neon-green/30" : ""
                    }`}
                  >
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${isUp ? "" : ""}`}
                      style={{
                        backgroundColor: isUp ? "#5a5a80" : "#ff005566",
                      }}
                    />
                    <span className="flex-1 truncate text-[11px] text-[#5a5a80]">
                      {hostname}
                    </span>
                    <span className="font-mono text-[9px] text-[#3a3a5a]">
                      {nodeId.slice(0, 8)}...
                    </span>
                    {isBeingAdded && (
                      <Plus className="h-3 w-3 shrink-0 text-neon-green" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Staged Changes Panel ── */
function StagedChanges({
  layout,
  status,
  allZones,
  onApply,
  onRevert,
}: {
  layout: LayoutResponse;
  status: StatusResponse | null;
  allZones: string[];
  onApply: () => Promise<void>;
  onRevert: () => Promise<void>;
}) {
  const [applying, setApplying] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const staged = Object.entries(layout.stagedRoleChanges);
  if (staged.length === 0) return null;

  async function handleApply() {
    setApplying(true);
    setMsg(null);
    try {
      await onApply();
      setMsg({ type: "success", message: "Layout applied successfully" });
    } catch (e: unknown) {
      setMsg({
        type: "error",
        message: e instanceof Error ? e.message : "Apply failed",
      });
    } finally {
      setApplying(false);
    }
  }

  async function handleRevert() {
    setReverting(true);
    setMsg(null);
    try {
      await onRevert();
      setMsg({ type: "success", message: "Staged changes reverted" });
    } catch (e: unknown) {
      setMsg({
        type: "error",
        message: e instanceof Error ? e.message : "Revert failed",
      });
    } finally {
      setReverting(false);
    }
  }

  return (
    <div className="glass-panel glass-panel-orange animate-in stagger-4 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-orange/10">
            <AlertTriangle className="h-3.5 w-3.5 text-neon-orange" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Staged Changes
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              {staged.length} pending change{staged.length !== 1 ? "s" : ""}{" "}
              &middot; Will create layout v{layout.version + 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRevert}
            disabled={reverting}
            className="flex items-center gap-1.5 rounded-xl border border-[#ff005525] bg-[#ff005508] px-3 py-1.5 text-[11px] font-medium text-neon-pink transition-all hover:bg-[#ff005512] disabled:opacity-40"
          >
            {reverting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Undo2 className="h-3 w-3" />
            )}
            Revert
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex items-center gap-1.5 rounded-xl border border-[#39ff1425] bg-[#39ff1408] px-3 py-1.5 text-[11px] font-medium text-neon-green transition-all hover:bg-[#39ff1412] disabled:opacity-40"
          >
            {applying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Rocket className="h-3 w-3" />
            )}
            Apply Layout
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {staged.map(([nodeId, change]) => {
          const hostname =
            status?.nodes[nodeId]?.hostname || nodeId.slice(0, 12);
          const isRemoval = change === null;
          const currentRole = layout.roles[nodeId];
          const isNew = !currentRole;

          return (
            <div
              key={nodeId}
              className="glass-inner flex items-center gap-3 rounded-xl p-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isRemoval
                    ? "bg-[#ff0055]/8 ring-1 ring-[#ff0055]/15"
                    : isNew
                      ? "bg-[#39ff14]/8 ring-1 ring-[#39ff14]/15"
                      : "bg-[#ff6b35]/8 ring-1 ring-[#ff6b35]/15"
                }`}
              >
                {isRemoval ? (
                  <Trash2 className="h-3.5 w-3.5 text-neon-pink" />
                ) : isNew ? (
                  <Plus className="h-3.5 w-3.5 text-neon-green" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 text-neon-orange" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-foreground">
                    {hostname}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] ${
                      isRemoval
                        ? "bg-[#ff0055]/10 text-neon-pink"
                        : isNew
                          ? "bg-[#39ff14]/10 text-neon-green"
                          : "bg-[#ff6b35]/10 text-neon-orange"
                    }`}
                  >
                    {isRemoval ? "REMOVE" : isNew ? "ADD" : "MODIFY"}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#5a5a80]">
                  {nodeId.slice(0, 20)}...
                </span>
              </div>

              {change && (
                <div className="text-right text-[10px]">
                  <span
                    className="font-medium"
                    style={{
                      color: getZoneColor(change.zone, allZones),
                    }}
                  >
                    {change.zone}
                  </span>
                  <span className="ml-2 text-[#5a5a80]">
                    {formatBytes(change.capacity)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && (
        <div className="mt-3">
          <StatusMessage status={msg} />
        </div>
      )}
    </div>
  );
}

/* ── Assign Node Form ── */
function AssignNodeForm({
  status,
  layout,
  allZones,
  onAssigned,
  clusterId,
}: {
  status: StatusResponse | null;
  layout: LayoutResponse;
  allZones: string[];
  onAssigned: () => void;
  clusterId?: string;
}) {
  const allNodeIds = status ? Object.keys(status.nodes) : [];
  const [nodeId, setNodeId] = useState("");
  const [zone, setZone] = useState("");
  const [customZone, setCustomZone] = useState("");
  const [capacityStr, setCapacityStr] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Pre-fill from existing role when node selected
  function handleNodeSelect(id: string) {
    setNodeId(id);
    const existing = layout.roles[id];
    if (existing) {
      setZone(existing.zone);
      setCapacityStr(formatBytes(existing.capacity));
      setTagsStr(existing.tags.join(", "));
    } else {
      setZone("");
      setCapacityStr("");
      setTagsStr("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nodeId) return;

    const effectiveZone = zone === "__custom__" ? customZone.trim() : zone;
    if (!effectiveZone) return;

    const capacity = parseCapacity(capacityStr);
    if (capacity === null || capacity <= 0) {
      setMsg({ type: "error", message: "Invalid capacity. Use format like: 100GB, 1TB, 500000000" });
      return;
    }

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/layout", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [nodeId]: { zone: effectiveZone, capacity, tags },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to stage layout change");
      setMsg({
        type: "success",
        message: `Staged: ${status?.nodes[nodeId]?.hostname || nodeId.slice(0, 12)} -> ${effectiveZone} (${formatBytes(capacity)})`,
      });
      onAssigned();
    } catch (err: unknown) {
      setMsg({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!nodeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/layout", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [nodeId]: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to stage removal");
      setMsg({
        type: "success",
        message: `Staged removal of ${status?.nodes[nodeId]?.hostname || nodeId.slice(0, 12)}`,
      });
      onAssigned();
    } catch (err: unknown) {
      setMsg({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  const isExistingNode = !!layout.roles[nodeId];
  const inputClass =
    "w-full rounded-xl border border-[#18183066] bg-[#05050a]/80 px-4 py-2.5 font-mono text-sm text-foreground placeholder-[#2a2a44] transition-all focus:border-[#00f0ff33] focus:outline-none";
  const nodeOptions = [
    { value: "", label: "Select a node..." },
    ...allNodeIds.map((id) => {
      const node = status?.nodes[id];
      const hostname = node?.hostname || id.slice(0, 16);
      const assigned = !!layout.roles[id];
      return {
        value: id,
        label: `${hostname} ${assigned ? "(assigned)" : "(unassigned)"} - ${id.slice(0, 12)}...`,
      };
    }),
  ];

  const zoneOptions = [
    { value: "", label: "Select zone..." },
    ...allZones.map((z) => ({ value: z, label: z })),
    { value: "__custom__", label: "+ New zone..." },
  ];

  return (
    <div className="glass-panel animate-in stagger-3 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
          <Plus className="h-3.5 w-3.5 text-neon-purple" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Assign Node
          </h3>
          <p className="text-[10px] text-[#5a5a80]">
            Stage a node role change (assign to zone with capacity)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Node selector */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
            Node
          </label>
          <NeonSelect
            value={nodeId}
            onChange={handleNodeSelect}
            options={nodeOptions}
            placeholder="Select a node..."
            color="#a855f7"
            className="mt-1.5"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Zone */}
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
              Zone
            </label>
            <NeonSelect
              value={zone}
              onChange={setZone}
              options={zoneOptions}
              placeholder="Select zone..."
              color="#3b82f6"
              className="mt-1.5"
            />
            {zone === "__custom__" && (
              <input
                type="text"
                value={customZone}
                onChange={(e) => setCustomZone(e.target.value)}
                placeholder="zone-name"
                className={`mt-1.5 ${inputClass}`}
              />
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
              Capacity
            </label>
            <input
              type="text"
              value={capacityStr}
              onChange={(e) => setCapacityStr(e.target.value)}
              placeholder="100GB, 1TB, etc."
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
            Tags (comma-separated, optional)
          </label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="fast, ssd, rack-1"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !nodeId || (!zone && !customZone) || !capacityStr}
            className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#a855f725] bg-[#a855f708] px-4 py-2.5 text-sm font-medium text-neon-purple transition-all hover:bg-[#a855f712] disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <HardDrive className="h-4 w-4" />
                {isExistingNode ? "Stage Update" : "Stage Assignment"}
              </>
            )}
          </button>

          {isExistingNode && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#ff005525] bg-[#ff005508] px-4 py-2.5 text-sm font-medium text-neon-pink transition-all hover:bg-[#ff005512] disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>

        {msg && <StatusMessage status={msg} />}
      </form>
    </div>
  );
}

/* ── Current Layout Table ── */
function LayoutTable({
  layout,
  status,
  allZones,
}: {
  layout: LayoutResponse;
  status: StatusResponse | null;
  allZones: string[];
}) {
  const entries = Object.entries(layout.roles);

  if (entries.length === 0) {
    return (
      <div className="glass-panel animate-in stagger-5 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5a5a80]/10">
            <Map className="h-3.5 w-3.5 text-[#5a5a80]" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Current Layout
          </h3>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 py-8">
          <Map className="h-8 w-8 text-[#141422]" />
          <p className="text-xs text-[#5a5a80]">No nodes assigned to the layout yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-in stagger-5 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3b82f6]/10">
          <Map className="h-3.5 w-3.5 text-neon-blue" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Current Layout
          </h3>
          <p className="text-[10px] text-[#5a5a80]">
            {entries.length} node{entries.length !== 1 ? "s" : ""} in layout v{layout.version}
          </p>
        </div>
      </div>

      {/* Header row */}
      <div className="mb-1.5 flex items-center gap-3 px-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
        <span className="w-5" />
        <span className="flex-[2]">Node</span>
        <span className="flex-1">Zone</span>
        <span className="flex-1 text-right">Capacity</span>
        <span className="flex-1">Tags</span>
      </div>

      <div className="space-y-1">
        {entries.map(([nodeId, role]) => {
          const hostname =
            status?.nodes[nodeId]?.hostname || nodeId.slice(0, 12);
          const isUp = status?.nodes[nodeId]?.isUp ?? false;
          const color = getZoneColor(role.zone, allZones);

          return (
            <div
              key={nodeId}
              className="glass-inner flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-[#0e0e1a]"
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${isUp ? "neon-pulse" : ""}`}
                style={{
                  backgroundColor: isUp ? "#39ff14" : "#ff005566",
                  boxShadow: isUp ? "0 0 4px #39ff1444" : "none",
                }}
              />
              <div className="flex-[2] min-w-0">
                <span className="truncate text-[11px] font-medium text-foreground">
                  {hostname}
                </span>
                <span className="ml-1.5 font-mono text-[9px] text-[#3a3a5a]">
                  {nodeId.slice(0, 8)}
                </span>
              </div>
              <div className="flex-1">
                <span
                  className="flex items-center gap-1 text-[11px] font-medium"
                  style={{ color }}
                >
                  <MapPin className="h-2.5 w-2.5" />
                  {role.zone}
                </span>
              </div>
              <span className="flex-1 text-right text-[11px] text-foreground">
                {formatBytes(role.capacity)}
              </span>
              <div className="flex flex-1 flex-wrap gap-0.5">
                {role.tags.length > 0 ? (
                  role.tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-0.5 rounded bg-[#141422] px-1.5 py-0.5 text-[8px] text-[#5a5a80]"
                    >
                      <Tag className="h-2 w-2" />
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[#3a3a5a]">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Quick Connect Panel ── */
function QuickConnectPanel({
  onConnected,
  clusterId,
}: {
  onConnected: () => void;
  clusterId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [ip, setIp] = useState("");
  const [adminPort, setAdminPort] = useState("3903");
  const [rpcPort, setRpcPort] = useState("3901");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDiscover(e: FormEvent) {
    e.preventDefault();
    const trimmed = ip.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/discover", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: trimmed,
          adminPort: parseInt(adminPort) || 3903,
          rpcPort: parseInt(rpcPort) || 3901,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to discover/connect node");
      setSuccess(`Connected ${data.hostname || trimmed} (${data.nodeId?.slice(0, 12)}...)`);
      setIp("");
      onConnected();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#18183066] bg-[#05050a]/80 px-4 py-2.5 font-mono text-sm text-foreground placeholder-[#2a2a44] transition-all focus:border-[#00f0ff33] focus:outline-none";
  const smallInputClass =
    "w-full rounded-xl border border-[#18183066] bg-[#05050a]/80 px-3 py-2 font-mono text-xs text-foreground placeholder-[#2a2a44] transition-all focus:border-[#00f0ff33] focus:outline-none";

  return (
    <div className="mt-4 rounded-xl border border-[#18183044] bg-[#05050a]/40">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-all hover:bg-[#ffffff04]"
      >
        <Terminal className="h-3.5 w-3.5 text-neon-orange" />
        <span className="flex-1 text-[11px] font-medium text-[#8a8ab0]">
          Quick Connect by IP
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-[#3a3a5a]" />
        ) : (
          <ChevronDown className="h-3 w-3 text-[#3a3a5a]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#18183044] px-4 pb-4 pt-3">
          <form onSubmit={handleDiscover} className="space-y-3">
            <p className="text-[11px] text-[#5a5a80]">
              Enter the node&apos;s IP — the dashboard will auto-discover its node ID and connect it.
            </p>
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                IP Address
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => { setIp(e.target.value); setError(null); setSuccess(null); }}
                placeholder="192.168.1.100"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                  Admin Port
                </label>
                <input
                  type="text"
                  value={adminPort}
                  onChange={(e) => setAdminPort(e.target.value)}
                  placeholder="3903"
                  className={`mt-1.5 ${smallInputClass}`}
                />
              </div>
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                  RPC Port
                </label>
                <input
                  type="text"
                  value={rpcPort}
                  onChange={(e) => setRpcPort(e.target.value)}
                  placeholder="3901"
                  className={`mt-1.5 ${smallInputClass}`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !ip.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ff6b3525] bg-[#ff6b3508] px-4 py-2.5 text-sm font-medium text-neon-orange transition-all hover:bg-[#ff6b3512] disabled:opacity-30"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Link className="h-3.5 w-3.5" />Discover &amp; Connect</>
              )}
            </button>
          </form>

          {success && (
            <div className="mt-3">
              <StatusMessage status={{ type: "success", message: success }} />
            </div>
          )}
          {error && (
            <div className="mt-3">
              <StatusMessage status={{ type: "error", message: error }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Add Node Wizard ── */
function AddNodeWizard({
  status,
  layout,
  allZones,
  onComplete,
  clusterId,
}: {
  status: StatusResponse | null;
  layout: LayoutResponse;
  allZones: string[];
  onComplete: () => void;
  clusterId?: string;
}) {
  const garageCli = process.env.NEXT_PUBLIC_GARAGE_CLI_PATH || "garage";
  const garageConfig = process.env.NEXT_PUBLIC_GARAGE_CLI_CONFIG;
  const cli = garageConfig ? `${garageCli} -c ${garageConfig}` : garageCli;
  const nodeIdCommand = `${cli} node id -q`;

  const STEPS = ["Connect", "Assign Role", "Apply", "Done"] as const;
  type Step = (typeof STEPS)[number];

  const [step, setStep] = useState<Step>("Connect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Step 1: Connect
  const [address, setAddress] = useState("");
  const [connectedNodeId, setConnectedNodeId] = useState<string | null>(null);

  // Step 2: Assign
  const [zone, setZone] = useState("");
  const [customZone, setCustomZone] = useState("");
  const [capacityStr, setCapacityStr] = useState("200GB");
  const [tagsStr, setTagsStr] = useState("");

  // Step 3: Apply
  const [applied, setApplied] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-[#18183066] bg-[#05050a]/80 px-4 py-2.5 font-mono text-sm text-foreground placeholder-[#2a2a44] transition-all focus:border-[#00f0ff33] focus:outline-none";

  // Detect the newly connected node from status (node that's in status but not in layout)
  const unassignedNodes = status
    ? Object.keys(status.nodes).filter((id) => !layout.roles[id])
    : [];

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    const addr = address.trim();
    if (!addr) return;

    if (!addr.includes("@")) {
      setError("Invalid format. Expected: node_id@ip:port");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/connect", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([addr]),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect node");

      // Extract the node ID (everything before @)
      const nodeId = addr.split("@")[0];
      setConnectedNodeId(nodeId);
      onComplete(); // refresh status + layout
      setStep("Assign Role");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    const targetNode = connectedNodeId || unassignedNodes[0];
    if (!targetNode) return;

    const effectiveZone = zone === "__custom__" ? customZone.trim() : zone;
    if (!effectiveZone) {
      setError("Select or enter a zone name");
      return;
    }

    const capacity = parseCapacity(capacityStr);
    if (capacity === null || capacity <= 0) {
      setError("Invalid capacity. Use format like: 200GB, 1TB");
      return;
    }

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/layout", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [targetNode]: { zone: effectiveZone, capacity, tags },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to stage layout");
      onComplete();
      setStep("Apply");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/layout/apply", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: layout.version + 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Apply failed");
      setApplied(true);
      onComplete();
      setStep("Done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep("Connect");
    setAddress("");
    setConnectedNodeId(null);
    setZone("");
    setCustomZone("");
    setCapacityStr("200GB");
    setTagsStr("");
    setApplied(false);
    setError(null);
  }

  function copyCmd() {
    navigator.clipboard.writeText(nodeIdCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  }

  const stepIdx = STEPS.indexOf(step);
  const connectedHostname = connectedNodeId && status?.nodes[connectedNodeId]?.hostname;

  return (
    <div className="glass-panel animate-in stagger-1 rounded-2xl p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-green/10">
          <Plus className="h-3.5 w-3.5 text-neon-green" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Add Node to Cluster
          </h3>
          <p className="text-[10px] text-[#5a5a80]">
            Connect, assign role, and apply layout in one flow
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isDone = i < stepIdx;
          const isCurrent = i === stepIdx;
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{
                    backgroundColor: isDone ? "#39ff1418" : isCurrent ? "#00f0ff15" : "#0a0a14",
                    color: isDone ? "#39ff14" : isCurrent ? "#00f0ff" : "#3a3a5a",
                    border: `1px solid ${isDone ? "#39ff1435" : isCurrent ? "#00f0ff35" : "#18183066"}`,
                    boxShadow: isCurrent ? "0 0 8px #00f0ff22" : "none",
                  }}
                >
                  {isDone ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </div>
                <span
                  className="hidden text-[10px] font-medium sm:inline"
                  style={{ color: isDone ? "#39ff14" : isCurrent ? "#00f0ff" : "#3a3a5a" }}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="mx-1 h-px flex-1"
                  style={{ backgroundColor: isDone ? "#39ff1440" : "#18183044" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Connect */}
      {step === "Connect" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#00f0ff]/[0.03] p-3 ring-1 ring-[#00f0ff]/10">
            <p className="text-[11px] text-[#5a5a80]">
              First, get the node ID by running this on the target machine:
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-[#05050a]/80 px-3 py-1.5 font-mono text-[11px] text-neon-cyan">
                {nodeIdCommand}
              </code>
              <button
                type="button"
                onClick={copyCmd}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#18183066] bg-[#05050a]/60 text-[#5a5a80] transition-all hover:text-neon-cyan"
              >
                {copiedCmd ? <Check className="h-3 w-3 text-neon-green" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                Node Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(null); }}
                placeholder="abcdef01234567...@192.168.1.100:3901"
                className={`mt-1.5 ${inputClass}`}
              />
              <p className="mt-1 text-[10px] text-[#3a3a5a]">
                Paste the full output: node_id@ip:port
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#00f0ff25] bg-[#00f0ff08] px-4 py-2.5 text-sm font-medium text-neon-cyan transition-all hover:bg-[#00f0ff12] disabled:opacity-30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Link className="h-4 w-4" />Connect Node</>}
            </button>
          </form>

          {/* Skip option if there are already unassigned nodes */}
          {unassignedNodes.length > 0 && (
            <button
              onClick={() => {
                setConnectedNodeId(unassignedNodes[0]);
                setStep("Assign Role");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#18183066] px-4 py-2 text-[11px] text-[#5a5a80] transition-all hover:border-[#5a5a80] hover:text-foreground"
            >
              <ArrowRight className="h-3 w-3" />
              Skip — {unassignedNodes.length} unassigned node{unassignedNodes.length !== 1 ? "s" : ""} already in cluster
            </button>
          )}
        </div>
      )}

      {/* Step 2: Assign Role */}
      {step === "Assign Role" && (
        <form onSubmit={handleAssign} className="space-y-3">
          {connectedHostname && (
            <div className="flex items-center gap-2 rounded-xl bg-[#39ff14]/[0.04] px-3 py-2 ring-1 ring-[#39ff14]/12">
              <CheckCircle2 className="h-3.5 w-3.5 text-neon-green" />
              <span className="text-[11px] text-neon-green">
                Connected: {connectedHostname}
              </span>
              <span className="font-mono text-[9px] text-[#5a5a80]">
                {connectedNodeId?.slice(0, 12)}...
              </span>
            </div>
          )}

          {/* Node selector (for when multiple unassigned) */}
          {unassignedNodes.length > 1 && (
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                Node
              </label>
              <NeonSelect
                value={connectedNodeId || ""}
                onChange={setConnectedNodeId}
                options={unassignedNodes.map((id) => ({
                  value: id,
                  label: `${status?.nodes[id]?.hostname || id.slice(0, 16)} — ${id.slice(0, 12)}...`,
                }))}
                placeholder="Select node..."
                color="#00f0ff"
                className="mt-1.5"
              />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                Zone
              </label>
              <NeonSelect
                value={zone}
                onChange={setZone}
                options={[
                  { value: "", label: "Select zone..." },
                  ...allZones.map((z) => ({ value: z, label: z })),
                  { value: "__custom__", label: "+ New zone..." },
                ]}
                placeholder="Select zone..."
                color="#3b82f6"
                className="mt-1.5"
              />
              {zone === "__custom__" && (
                <input
                  type="text"
                  value={customZone}
                  onChange={(e) => setCustomZone(e.target.value)}
                  placeholder="zone-name"
                  className={`mt-1.5 ${inputClass}`}
                />
              )}
              <p className="mt-1 text-[10px] text-[#3a3a5a]">
                Use unique zones per node for replication
              </p>
            </div>
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                Capacity
              </label>
              <input
                type="text"
                value={capacityStr}
                onChange={(e) => { setCapacityStr(e.target.value); setError(null); }}
                placeholder="200GB"
                className={`mt-1.5 ${inputClass}`}
              />
              <p className="mt-1 text-[10px] text-[#3a3a5a]">
                e.g. 200GB, 1TB, 500MB
              </p>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
              Tags (optional)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="ssd, fast, rack-1"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("Connect")}
              className="rounded-xl border border-[#18183066] px-4 py-2.5 text-sm text-[#5a5a80] transition-all hover:text-foreground"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || (!zone && !customZone) || !capacityStr}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#a855f725] bg-[#a855f708] px-4 py-2.5 text-sm font-medium text-neon-purple transition-all hover:bg-[#a855f712] disabled:opacity-30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><HardDrive className="h-4 w-4" />Stage Assignment</>}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Apply */}
      {step === "Apply" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#ff6b35]/[0.04] p-3 ring-1 ring-[#ff6b35]/12">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-neon-orange" />
              <span className="text-[11px] font-medium text-neon-orange">
                Staged change ready
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[#5a5a80]">
              Applying will create layout v{layout.version + 1} and Garage will begin rebalancing data to the new node.
            </p>
          </div>

          {/* Summary */}
          <div className="glass-inner rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#39ff14]/8 ring-1 ring-[#39ff14]/15">
                <Server className="h-3.5 w-3.5 text-neon-green" />
              </div>
              <div className="flex-1">
                <span className="text-[12px] font-medium text-foreground">
                  {connectedHostname || connectedNodeId?.slice(0, 16) || "New node"}
                </span>
                <div className="flex gap-2 text-[10px] text-[#5a5a80]">
                  <span>{zone === "__custom__" ? customZone : zone}</span>
                  <span>&middot;</span>
                  <span>{capacityStr}</span>
                  {tagsStr && <><span>&middot;</span><span>{tagsStr}</span></>}
                </div>
              </div>
              <span className="rounded-full bg-[#39ff14]/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.06em] text-neon-green">
                ADD
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("Assign Role")}
              className="rounded-xl border border-[#18183066] px-4 py-2.5 text-sm text-[#5a5a80] transition-all hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#39ff1425] bg-[#39ff1408] px-4 py-2.5 text-sm font-medium text-neon-green transition-all hover:bg-[#39ff1412] disabled:opacity-30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Rocket className="h-4 w-4" />Apply Layout v{layout.version + 1}</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "Done" && (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#39ff14]/8 ring-1 ring-[#39ff14]/15">
              <CheckCircle2 className="h-6 w-6 text-neon-green" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Node Added Successfully</p>
              <p className="mt-1 text-[11px] text-[#5a5a80]">
                Layout v{layout.version + 1} applied. Garage is now rebalancing data across the cluster.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#00f0ff25] bg-[#00f0ff08] px-4 py-2.5 text-sm font-medium text-neon-cyan transition-all hover:bg-[#00f0ff12]"
          >
            <Plus className="h-4 w-4" />
            Add Another Node
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3">
          <StatusMessage status={{ type: "error", message: error }} />
        </div>
      )}

      {/* Quick Connect Panel */}
      <QuickConnectPanel onConnected={onComplete} clusterId={clusterId} />
    </div>
  );
}

/* ── Storage Summary Panel ── */
function LayoutStorageSummary({
  layout,
  status,
}: {
  layout: LayoutResponse;
  status: StatusResponse | null;
}) {
  const replicationFactor = status?.replicationFactor ?? 1;
  const roles = Object.values(layout.roles);
  const totalAllocated = roles.reduce((s, r) => s + r.capacity, 0);
  const effectiveCapacity = totalAllocated / replicationFactor;
  const zones = new Set(roles.map((r) => r.zone)).size;

  // Calculate projected values if staged changes exist
  const stagedEntries = Object.entries(layout.stagedRoleChanges);
  const hasStaged = stagedEntries.length > 0;

  let projectedAllocated = totalAllocated;
  if (hasStaged) {
    for (const [nodeId, change] of stagedEntries) {
      if (change === null) {
        // Removal — subtract existing capacity
        const existing = layout.roles[nodeId];
        if (existing) projectedAllocated -= existing.capacity;
      } else if (layout.roles[nodeId]) {
        // Modification — replace capacity
        projectedAllocated += change.capacity - layout.roles[nodeId].capacity;
      } else {
        // Addition — add new capacity
        projectedAllocated += change.capacity;
      }
    }
  }
  const projectedEffective = projectedAllocated / replicationFactor;

  const items = [
    {
      label: "Total Allocated",
      value: formatBytes(totalAllocated),
      color: "#00f0ff",
    },
    {
      label: "Replication Factor",
      value: `${replicationFactor}x`,
      color: "#a855f7",
    },
    {
      label: "Effective Capacity",
      value: formatBytes(effectiveCapacity),
      color: "#39ff14",
    },
    {
      label: "Zones / Nodes",
      value: `${zones} / ${roles.length}`,
      color: "#ff6b35",
    },
  ];

  return (
    <div className="glass-panel animate-in stagger-2 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-green/10">
          <Disc3 className="h-3.5 w-3.5 text-neon-green" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Storage Summary
          </h3>
          <p className="text-[10px] text-[#5a5a80]">
            Effective capacity after {replicationFactor}x replication
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-[#05050a]/60 p-3 ring-1 ring-[#18183044]"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
              {item.label}
            </p>
            <p
              className="mt-1.5 text-lg font-bold tracking-tight"
              style={{ color: item.color }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Projected changes bar */}
      {hasStaged && (
        <div className="mt-3 rounded-xl bg-[#ff6b35]/[0.04] p-3 ring-1 ring-[#ff6b35]/12">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-neon-orange" />
            <span className="text-[10px] font-medium text-neon-orange">
              After staged changes
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px]">
            <span className="text-[#5a5a80]">
              Allocated:{" "}
              <span className="font-medium text-foreground">
                {formatBytes(projectedAllocated)}
              </span>
            </span>
            <span className="text-[#3a3a5a]">&rarr;</span>
            <span className="text-[#5a5a80]">
              Effective:{" "}
              <span className="font-medium text-neon-green">
                {formatBytes(projectedEffective)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Layout Creator ── */
export function LayoutCreator({ status, onStatusRefresh, clusterId }: LayoutCreatorProps) {
  const layout = useApi<LayoutResponse>("/api/garage/layout", clusterId);

  if (layout.loading || !layout.data) {
    return (
      <div className="glass-panel animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-cyan/10">
            <Map className="h-3.5 w-3.5 text-neon-cyan" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Cluster Layout
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[#5a5a80]" />
          <p className="text-xs text-[#5a5a80]">Loading layout...</p>
        </div>
      </div>
    );
  }

  if (layout.error) {
    return (
      <div className="glass-panel animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-pink/10">
            <XCircle className="h-3.5 w-3.5 text-neon-pink" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Layout Error
          </h3>
        </div>
        <div className="mt-4 rounded-xl bg-[#ff0055]/5 p-3 ring-1 ring-[#ff0055]/10">
          <p className="break-all font-mono text-xs text-neon-pink/80">
            {layout.error}
          </p>
        </div>
      </div>
    );
  }

  const layoutData = layout.data;

  // Collect all known zones
  const zoneSet = new Set<string>();
  for (const role of Object.values(layoutData.roles)) {
    zoneSet.add(role.zone);
  }
  for (const change of Object.values(layoutData.stagedRoleChanges)) {
    if (change) zoneSet.add(change.zone);
  }
  const allZones = Array.from(zoneSet).sort();

  async function handleApply() {
    const res = await fetch(buildApiUrl("/api/garage/layout/apply", clusterId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: layoutData.version + 1 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Apply failed");
    layout.refresh();
  }

  async function handleRevert() {
    const res = await fetch(buildApiUrl("/api/garage/layout/revert", clusterId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: layoutData.version }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Revert failed");
    layout.refresh();
  }

  function refreshAll() {
    layout.refresh();
    onStatusRefresh?.();
  }

  return (
    <div className="space-y-4">
      {/* Storage Summary */}
      <LayoutStorageSummary layout={layoutData} status={status} />

      {/* Visual Topology */}
      <ZoneTopology
        layout={layoutData}
        status={status}
        allZones={allZones}
      />

      {/* Staged Changes (only if any) */}
      <StagedChanges
        layout={layoutData}
        status={status}
        allZones={allZones}
        onApply={handleApply}
        onRevert={handleRevert}
      />

      {/* Add Node Wizard + Manage Existing Nodes */}
      <div className="grid gap-4 xl:grid-cols-2">
        <AddNodeWizard
          status={status}
          layout={layoutData}
          allZones={allZones}
          onComplete={refreshAll}
          clusterId={clusterId}
        />
        <AssignNodeForm
          status={status}
          layout={layoutData}
          allZones={allZones}
          onAssigned={layout.refresh}
          clusterId={clusterId}
        />
      </div>

      {/* Layout Table */}
      <LayoutTable
        layout={layoutData}
        status={status}
        allZones={allZones}
      />
    </div>
  );
}
