"use client";

import { useState, FormEvent } from "react";
import { useClusterId, buildApiUrl } from "@/lib/hooks";
import { BucketDetail, KeyDetail } from "@/lib/types";
import { NeonSelect } from "@/components/ui/neon-select";
import {
  Database,
  KeyRound,
  Plus,
  Link2,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  FileText,
  Copy,
  Check,
} from "lucide-react";

interface CreatePanelProps {
  buckets: BucketDetail[];
  keys: KeyDetail[];
  onCreated: () => void;
  clusterId?: string;
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

function NeonInput({
  value,
  onChange,
  placeholder,
  color = "#00f0ff",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  color?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#18183066] bg-[#05050a]/80 px-4 py-2.5 font-mono text-sm text-foreground placeholder-[#2a2a44] transition-all duration-200 focus:outline-none"
      style={{
        boxShadow: value ? `0 0 0 1px ${color}22, 0 0 12px ${color}08` : undefined,
        borderColor: value ? `${color}33` : undefined,
      }}
    />
  );
}

function NeonButton({
  children,
  disabled,
  loading,
  color,
  type = "submit",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  color: string;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 disabled:opacity-30"
      style={{
        color,
        backgroundColor: `${color}08`,
        border: `1px solid ${color}25`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${color}10, transparent)`,
        }}
      />
      {loading ? (
        <Loader2 className="relative h-4 w-4 animate-spin" />
      ) : (
        <span className="relative flex items-center gap-2">{children}</span>
      )}
    </button>
  );
}

function CreateBucketForm({ onCreated, clusterId }: { onCreated: () => void; clusterId?: string }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/buckets", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalAlias: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bucket");
      setStatus({
        type: "success",
        message: `Bucket "${name}" created (${data.id?.slice(0, 16)}...)`,
      });
      setName("");
      onCreated();
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel glass-panel-purple rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
          <Database className="h-3.5 w-3.5 text-neon-purple" />
        </div>
        <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
          Create Bucket
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
            Bucket Name (Global Alias)
          </label>
          <div className="mt-1.5">
            <NeonInput
              value={name}
              onChange={setName}
              placeholder="my-bucket-name"
              color="#a855f7"
            />
          </div>
        </div>
        <NeonButton disabled={loading || !name.trim()} loading={loading} color="#a855f7">
          <Plus className="h-4 w-4" />
          Create Bucket
        </NeonButton>
        {status && <StatusMessage status={status} />}
      </form>
    </div>
  );
}

function CreateKeyForm({ onCreated, clusterId }: { onCreated: () => void; clusterId?: string }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [createdKey, setCreatedKey] = useState<{
    name: string;
    accessKeyId: string;
    secretAccessKey: string;
  } | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setStatus(null);
    setCreatedKey(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/keys", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setCreatedKey({
        name: name.trim(),
        accessKeyId: data.accessKeyId,
        secretAccessKey: data.secretAccessKey,
      });
      setStatus({ type: "success", message: `Key "${name}" created` });
      setName("");
      onCreated();
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel glass-panel-orange rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-orange/10">
          <KeyRound className="h-3.5 w-3.5 text-neon-orange" />
        </div>
        <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
          Create Access Key
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
            Key Name
          </label>
          <div className="mt-1.5">
            <NeonInput
              value={name}
              onChange={setName}
              placeholder="my-access-key"
              color="#ff6b35"
            />
          </div>
        </div>
        <NeonButton disabled={loading || !name.trim()} loading={loading} color="#ff6b35">
          <Plus className="h-4 w-4" />
          Create Key
        </NeonButton>
        {status && <StatusMessage status={status} />}

        {createdKey && (
          <div className="rounded-xl bg-[#39ff14]/5 p-3.5 ring-1 ring-[#39ff14]/15">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neon-green">
              <Sparkles className="h-3 w-3" />
              Save these credentials now
            </p>
            <div className="mt-2.5 space-y-2 text-[11px]">
              <div className="rounded-lg bg-[#05050a]/80 p-2">
                <span className="text-[9px] uppercase tracking-[0.1em] text-[#5a5a80]">
                  Access Key
                </span>
                <code className="mt-0.5 block break-all font-mono text-neon-cyan">
                  {createdKey.accessKeyId}
                </code>
              </div>
              <div className="rounded-lg bg-[#05050a]/80 p-2">
                <span className="text-[9px] uppercase tracking-[0.1em] text-[#5a5a80]">
                  Secret Key
                </span>
                <code className="mt-0.5 block break-all font-mono text-neon-pink">
                  {createdKey.secretAccessKey}
                </code>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const csv = `Name,Access Key ID,Secret Access Key\n"${createdKey.name}","${createdKey.accessKeyId}","${createdKey.secretAccessKey}"`;
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${createdKey.name || "key"}-credentials.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#05050a]/80 px-2.5 py-2 text-[10px] font-medium text-neon-cyan transition-all hover:bg-[#05050a] hover:ring-1 hover:ring-neon-cyan/20"
              >
                <Download className="h-3 w-3" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  const env = `# ${createdKey.name}\nAWS_ACCESS_KEY_ID=${createdKey.accessKeyId}\nAWS_SECRET_ACCESS_KEY=${createdKey.secretAccessKey}`;
                  const blob = new Blob([env], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${createdKey.name || "key"}-credentials.env`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#05050a]/80 px-2.5 py-2 text-[10px] font-medium text-neon-purple transition-all hover:bg-[#05050a] hover:ring-1 hover:ring-neon-purple/20"
              >
                <FileText className="h-3 w-3" />
                .env
              </button>
              <button
                type="button"
                onClick={() => {
                  const md = `### ${createdKey.name}\n\n| Key | Value |\n|---|---|\n| Access Key ID | \`${createdKey.accessKeyId}\` |\n| Secret Access Key | \`${createdKey.secretAccessKey}\` |`;
                  navigator.clipboard.writeText(md);
                  setCopiedMd(true);
                  setTimeout(() => setCopiedMd(false), 2000);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#05050a]/80 px-2.5 py-2 text-[10px] font-medium text-neon-green transition-all hover:bg-[#05050a] hover:ring-1 hover:ring-neon-green/20"
              >
                {copiedMd ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copiedMd ? "Copied!" : "Markdown"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function AllowKeyForm({
  buckets,
  keys,
  onCreated,
  clusterId,
}: {
  buckets: BucketDetail[];
  keys: KeyDetail[];
  onCreated: () => void;
  clusterId?: string;
}) {
  const [bucketId, setBucketId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [read, setRead] = useState(true);
  const [write, setWrite] = useState(true);
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bucketId || !keyId) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(buildApiUrl("/api/garage/bucket-allow", clusterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucketId,
          accessKeyId: keyId,
          permissions: { read, write, owner },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant access");
      setStatus({ type: "success", message: "Permissions granted successfully" });
      onCreated();
    } catch (err: unknown) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  const bucketOptions = [
    { value: "", label: "Select bucket..." },
    ...buckets.map((b) => ({
      value: b.id,
      label: b.globalAliases?.[0] ?? b.id.slice(0, 24),
    })),
  ];

  const keyOptions = [
    { value: "", label: "Select key..." },
    ...keys.map((k) => ({
      value: k.accessKeyId,
      label: `${k.name} (${k.accessKeyId.slice(0, 16)})`,
    })),
  ];

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-cyan/10">
          <Link2 className="h-3.5 w-3.5 text-neon-cyan" />
        </div>
        <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
          Grant Bucket Access
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
              Bucket
            </label>
            <NeonSelect
              value={bucketId}
              onChange={setBucketId}
              options={bucketOptions}
              placeholder="Select bucket..."
              color="#a855f7"
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
              Access Key
            </label>
            <NeonSelect
              value={keyId}
              onChange={setKeyId}
              options={keyOptions}
              placeholder="Select key..."
              color="#ff6b35"
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
            Permissions
          </label>
          <div className="mt-2.5 flex gap-5">
            {[
              { label: "Read", value: read, set: setRead, color: "#39ff14" },
              { label: "Write", value: write, set: setWrite, color: "#00f0ff" },
              { label: "Owner", value: owner, set: setOwner, color: "#a855f7" },
            ].map((perm) => (
              <label
                key={perm.label}
                className="flex cursor-pointer items-center gap-2.5"
              >
                <div
                  className="relative flex h-5 w-5 items-center justify-center rounded-md transition-all duration-200"
                  style={{
                    borderWidth: "1.5px",
                    borderStyle: "solid",
                    borderColor: perm.value ? perm.color : "#18183066",
                    backgroundColor: perm.value ? `${perm.color}12` : "transparent",
                    boxShadow: perm.value ? `0 0 8px ${perm.color}22` : "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={perm.value}
                    onChange={(e) => perm.set(e.target.checked)}
                    className="sr-only"
                  />
                  {perm.value && (
                    <div
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: perm.color }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {perm.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <NeonButton disabled={loading || !bucketId || !keyId} loading={loading} color="#00f0ff">
          <Link2 className="h-4 w-4" />
          Grant Access
        </NeonButton>
        {status && <StatusMessage status={status} />}
      </form>
    </div>
  );
}

export function CreatePanel({ buckets, keys, onCreated, clusterId }: CreatePanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CreateBucketForm onCreated={onCreated} clusterId={clusterId} />
        <CreateKeyForm onCreated={onCreated} clusterId={clusterId} />
      </div>
      <AllowKeyForm buckets={buckets} keys={keys} onCreated={onCreated} clusterId={clusterId} />
    </div>
  );
}
