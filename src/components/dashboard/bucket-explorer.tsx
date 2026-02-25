"use client";

import { useState, useCallback, useEffect } from "react";
import { BucketDetail, S3Object, S3ListResponse } from "@/lib/types";
import { formatBytes } from "@/lib/hooks";
import {
  FolderOpen,
  File,
  ChevronRight,
  ArrowLeft,
  Link2,
  Copy,
  Check,
  Loader2,
  FolderClosed,
  Image,
  FileText,
  FileCode,
  FileArchive,
  Film,
  Music,
  Database,
  RefreshCw,
  Clock,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";

interface BucketExplorerProps {
  buckets: BucketDetail[];
}

const EXPIRY_OPTIONS = [
  { label: "15 min", value: 900 },
  { label: "1 hour", value: 3600 },
  { label: "6 hours", value: 21600 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
];

function getFileIcon(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "bmp", "avif"];
  const videoExts = ["mp4", "webm", "avi", "mov", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac"];
  const archiveExts = ["zip", "tar", "gz", "bz2", "rar", "7z", "xz"];
  const codeExts = ["js", "ts", "tsx", "jsx", "py", "go", "rs", "json", "yaml", "yml", "toml", "xml", "html", "css"];
  const docExts = ["txt", "md", "pdf", "doc", "docx", "csv"];

  if (imageExts.includes(ext)) return Image;
  if (videoExts.includes(ext)) return Film;
  if (audioExts.includes(ext)) return Music;
  if (archiveExts.includes(ext)) return FileArchive;
  if (codeExts.includes(ext)) return FileCode;
  if (docExts.includes(ext)) return FileText;
  return File;
}

function getFileColor(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "bmp", "avif"];
  const videoExts = ["mp4", "webm", "avi", "mov", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac"];

  if (imageExts.includes(ext)) return "#a855f7";
  if (videoExts.includes(ext)) return "#ff6b35";
  if (audioExts.includes(ext)) return "#ff0055";
  return "#5a5a80";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BucketExplorer({ buckets }: BucketExplorerProps) {
  // Credentials state — in-memory only, cleared on page refresh
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3SecretKey, setS3SecretKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);

  // Presign state
  const [presigningKey, setPresigningKey] = useState<string | null>(null);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [presignExpiry, setPresignExpiry] = useState(3600);
  const [presignLoading, setPresignLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const s3Headers = {
    "x-s3-access-key": s3AccessKey,
    "x-s3-secret-key": s3SecretKey,
  };

  const disconnectCredentials = () => {
    setS3AccessKey("");
    setS3SecretKey("");
    setIsAuthenticated(false);
    setShowSecret(false);
    setAuthError(null);
    setSelectedBucket("");
    setPrefix("");
    setObjects([]);
    setPrefixes([]);
    setExpandedKey(null);
    setPresignedUrl(null);
  };

  const selectedBucketName =
    buckets.find((b) => b.id === selectedBucket)?.globalAliases?.[0] ??
    selectedBucket.slice(0, 16);

  const fetchObjects = useCallback(
    async (bucket: string, pfx: string, token?: string) => {
      if (!bucket) return;
      setLoading(true);
      setError(null);

      const bucketName =
        buckets.find((b) => b.id === bucket)?.globalAliases?.[0] ?? bucket;

      const params = new URLSearchParams({ bucket: bucketName, prefix: pfx });
      if (token) params.set("continuationToken", token);

      try {
        const res = await fetch(`/api/garage/s3/objects?${params}`, {
          headers: s3Headers,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data: S3ListResponse = await res.json();

        if (token) {
          setObjects((prev) => [...prev, ...data.objects]);
        } else {
          setObjects(data.objects);
        }
        setPrefixes(data.prefixes);
        setIsTruncated(data.isTruncated);
        setNextToken(data.nextContinuationToken);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to list objects");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buckets, s3AccessKey, s3SecretKey],
  );

  useEffect(() => {
    if (selectedBucket) {
      setExpandedKey(null);
      setPresignedUrl(null);
      fetchObjects(selectedBucket, prefix);
    }
  }, [selectedBucket, prefix, fetchObjects]);

  const navigateToPrefix = (newPrefix: string) => {
    setPrefix(newPrefix);
    setExpandedKey(null);
    setPresignedUrl(null);
  };

  const breadcrumbs = prefix
    .split("/")
    .filter(Boolean)
    .map((part, i, arr) => ({
      label: part,
      prefix: arr.slice(0, i + 1).join("/") + "/",
    }));

  const generatePresignedUrl = async (key: string) => {
    const bucketName =
      buckets.find((b) => b.id === selectedBucket)?.globalAliases?.[0] ??
      selectedBucket;

    setPresigningKey(key);
    setPresignLoading(true);
    setPresignedUrl(null);
    setCopied(false);

    try {
      const res = await fetch("/api/garage/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...s3Headers },
        body: JSON.stringify({
          bucket: bucketName,
          key,
          expiresIn: presignExpiry,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPresignedUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate URL");
    } finally {
      setPresignLoading(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Credentials prompt — shown when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="glass-panel glass-panel-purple animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
            <KeyRound className="h-3.5 w-3.5 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Bucket Explorer
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              Enter your S3 access keys to browse bucket objects
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#05050a]/60 p-4 ring-1 ring-[#18183044] space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80] mb-1.5">
              Access Key ID
            </label>
            <input
              type="text"
              value={s3AccessKey}
              onChange={(e) => { setS3AccessKey(e.target.value); setAuthError(null); }}
              placeholder="GKxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-[#18183066] bg-[#0a0a14] px-3 py-2 font-mono text-[12px] text-white outline-none placeholder:text-[#5a5a80]/40 focus:border-neon-purple/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80] mb-1.5">
              Secret Access Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={s3SecretKey}
                onChange={(e) => { setS3SecretKey(e.target.value); setAuthError(null); }}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-[#18183066] bg-[#0a0a14] px-3 py-2 pr-10 font-mono text-[12px] text-white outline-none placeholder:text-[#5a5a80]/40 focus:border-neon-purple/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a5a80] hover:text-foreground transition-colors"
              >
                {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="rounded-lg bg-[#ff0055]/5 px-3 py-2 ring-1 ring-[#ff0055]/10">
              <p className="text-[11px] text-neon-pink">{authError}</p>
            </div>
          )}

          <button
            onClick={() => {
              if (!s3AccessKey.trim() || !s3SecretKey.trim()) {
                setAuthError("Both Access Key ID and Secret Access Key are required");
                return;
              }
              setIsAuthenticated(true);
              setAuthError(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neon-purple/15 bg-neon-purple/5 px-3 py-2.5 text-[12px] font-medium text-neon-purple transition-all hover:bg-neon-purple/10"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Connect & Explore
          </button>

          <p className="text-[9px] text-[#5a5a80]/60 text-center">
            Keys are stored in memory only and cleared on page refresh
          </p>
        </div>
      </div>
    );
  }

  // No bucket selected state
  if (!selectedBucket && buckets.length > 0) {
    return (
      <div className="glass-panel glass-panel-purple animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
              <FolderOpen className="h-3.5 w-3.5 text-neon-purple" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
                Bucket Explorer
              </h3>
              <p className="text-[10px] text-[#5a5a80]">
                Browse objects and generate presigned URLs
              </p>
            </div>
          </div>
          <button
            onClick={disconnectCredentials}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-neon-pink/60 transition-colors hover:bg-[#ff0055]/5 hover:text-neon-pink"
            title="Disconnect keys"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>

        <p className="text-xs text-[#5a5a80] mb-3">Select a bucket to explore</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {buckets.map((bucket) => {
            const alias =
              bucket.globalAliases?.[0] ?? bucket.id.slice(0, 16) + "...";
            return (
              <button
                key={bucket.id}
                onClick={() => setSelectedBucket(bucket.id)}
                className="glass-inner flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-[#0e0e1a] hover:border-neon-purple/20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-purple/8">
                  <Database className="h-4 w-4 text-neon-purple/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {alias}
                  </p>
                  <p className="text-[10px] text-[#5a5a80]">
                    {(bucket.objects ?? 0).toLocaleString()} objects &middot;{" "}
                    {formatBytes(bucket.bytes ?? 0)}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#5a5a80]" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="glass-panel glass-panel-purple animate-in stagger-2 rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
            <FolderOpen className="h-3.5 w-3.5 text-neon-purple" />
          </div>
          <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
            Bucket Explorer
          </h3>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 py-10">
          <FolderOpen className="h-8 w-8 text-[#141422]" />
          <p className="text-xs text-[#5a5a80]">No buckets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel glass-panel-purple animate-in stagger-2 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/10">
            <FolderOpen className="h-3.5 w-3.5 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-medium tracking-wide text-foreground">
              Bucket Explorer
            </h3>
            <p className="text-[10px] text-[#5a5a80]">
              Browsing objects in &ldquo;{selectedBucketName}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchObjects(selectedBucket, prefix)}
            className="rounded-lg p-1.5 text-[#5a5a80] transition-colors hover:bg-[#141422] hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setSelectedBucket("");
              setPrefix("");
              setObjects([]);
              setPrefixes([]);
              setExpandedKey(null);
              setPresignedUrl(null);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#5a5a80] transition-colors hover:bg-[#141422] hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">All Buckets</span>
          </button>
          <button
            onClick={disconnectCredentials}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-neon-pink/60 transition-colors hover:bg-[#ff0055]/5 hover:text-neon-pink"
            title="Disconnect keys"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Bucket selector (compact) */}
      <div className="mb-3 flex items-center gap-2">
        <select
          value={selectedBucket}
          onChange={(e) => {
            setSelectedBucket(e.target.value);
            setPrefix("");
          }}
          className="rounded-lg border border-[#18183066] bg-[#0a0a14] px-3 py-1.5 text-[11px] font-medium text-white outline-none focus:border-neon-purple/30 transition-colors"
        >
          {buckets.map((b) => (
            <option key={b.id} value={b.id} style={{ backgroundColor: "#0a0a14", color: "#e0e0f0" }}>
              {b.globalAliases?.[0] ?? b.id.slice(0, 24)}
            </option>
          ))}
        </select>
      </div>

      {/* Breadcrumb navigation */}
      <div className="mb-3 flex items-center gap-1 overflow-x-auto rounded-lg bg-[#05050a]/60 px-3 py-2">
        <button
          onClick={() => navigateToPrefix("")}
          className={`shrink-0 text-[11px] font-medium transition-colors ${
            prefix === ""
              ? "text-neon-purple"
              : "text-[#5a5a80] hover:text-foreground"
          }`}
        >
          /
        </button>
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.prefix} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="h-2.5 w-2.5 text-[#5a5a80]/40" />
            <button
              onClick={() => navigateToPrefix(crumb.prefix)}
              className={`text-[11px] font-medium transition-colors ${
                i === breadcrumbs.length - 1
                  ? "text-neon-purple"
                  : "text-[#5a5a80] hover:text-foreground"
              }`}
            >
              {crumb.label}
            </button>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-lg bg-[#ff0055]/5 px-3 py-2 ring-1 ring-[#ff0055]/10">
          <p className="text-[11px] text-neon-pink">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && objects.length === 0 && prefixes.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-neon-purple/50" />
        </div>
      )}

      {/* Object list */}
      {(!loading || objects.length > 0 || prefixes.length > 0) && (
        <div className="space-y-1">
          {/* Folders */}
          {prefixes.map((pfx) => {
            const folderName = pfx.slice(prefix.length).replace(/\/$/, "");
            return (
              <button
                key={pfx}
                onClick={() => navigateToPrefix(pfx)}
                className="glass-inner flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-[#0e0e1a]"
              >
                <FolderClosed className="h-4 w-4 shrink-0 text-neon-purple/70" />
                <span className="flex-1 truncate text-[12px] font-medium text-foreground">
                  {folderName}/
                </span>
                <ChevronRight className="h-3 w-3 shrink-0 text-[#5a5a80]" />
              </button>
            );
          })}

          {/* Files */}
          {objects
            .filter((obj) => obj.key !== prefix) // exclude the prefix itself
            .map((obj) => {
              const fileName = obj.key.slice(prefix.length);
              const FileIcon = getFileIcon(obj.key);
              const fileColor = getFileColor(obj.key);
              const isExpanded = expandedKey === obj.key;

              return (
                <div
                  key={obj.key}
                  className="glass-inner overflow-hidden rounded-xl transition-all"
                >
                  <button
                    onClick={() => {
                      setExpandedKey(isExpanded ? null : obj.key);
                      setPresignedUrl(null);
                      setPresigningKey(null);
                      setCopied(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#0e0e1a]"
                  >
                    <FileIcon
                      className="h-4 w-4 shrink-0"
                      style={{ color: fileColor }}
                    />
                    <span className="flex-1 min-w-0 truncate text-[12px] font-medium text-foreground">
                      {fileName}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 text-[10px] text-[#5a5a80]">
                      <span className="hidden sm:inline">
                        {formatDate(obj.lastModified)}
                      </span>
                      <span className="font-medium" style={{ color: fileColor }}>
                        {formatBytes(obj.size)}
                      </span>
                    </div>
                  </button>

                  {/* Expanded details + presign */}
                  {isExpanded && (
                    <div className="border-t border-[#18183033] px-4 py-3 space-y-3">
                      {/* File details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "Size", value: formatBytes(obj.size), color: "#a855f7" },
                          { label: "Modified", value: formatDate(obj.lastModified), color: "#00f0ff" },
                          {
                            label: "ETag",
                            value: obj.etag?.replace(/"/g, "").slice(0, 12) ?? "—",
                            color: "#5a5a80",
                          },
                          {
                            label: "Class",
                            value: obj.storageClass ?? "STANDARD",
                            color: "#39ff14",
                          },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="rounded-lg bg-[#05050a]/80 p-2"
                          >
                            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                              {s.label}
                            </p>
                            <p
                              className="mt-0.5 truncate text-[11px] font-medium"
                              style={{ color: s.color }}
                            >
                              {s.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Full key */}
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                          Full Key
                        </p>
                        <p className="mt-0.5 break-all font-mono text-[10px] text-[#5a5a80]">
                          {obj.key}
                        </p>
                      </div>

                      {/* Presign URL section */}
                      <div className="rounded-xl bg-[#05050a]/60 p-3 ring-1 ring-[#18183044]">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="h-3.5 w-3.5 text-neon-cyan/60" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5a5a80]">
                            Presigned URL
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-[#5a5a80]" />
                            <span className="text-[10px] text-[#5a5a80]">Expires in:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {EXPIRY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setPresignExpiry(opt.value);
                                  setPresignedUrl(null);
                                  setCopied(false);
                                }}
                                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                                  presignExpiry === opt.value
                                    ? "bg-neon-cyan/10 text-neon-cyan ring-1 ring-neon-cyan/20"
                                    : "text-[#5a5a80] hover:text-foreground hover:bg-[#141422]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => generatePresignedUrl(obj.key)}
                          disabled={presignLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-neon-cyan/15 bg-neon-cyan/5 px-3 py-2 text-[11px] font-medium text-neon-cyan transition-all hover:bg-neon-cyan/10 disabled:opacity-50"
                        >
                          {presignLoading && presigningKey === obj.key ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Link2 className="h-3.5 w-3.5" />
                          )}
                          Generate Presigned URL
                        </button>

                        {presignedUrl && presigningKey === obj.key && (
                          <div className="mt-2 space-y-2">
                            <div className="group relative rounded-lg bg-[#05050a] p-2.5 ring-1 ring-neon-cyan/10">
                              <p className="break-all font-mono text-[10px] leading-relaxed text-neon-cyan/70 pr-8">
                                {presignedUrl}
                              </p>
                              <button
                                onClick={() => copyUrl(presignedUrl)}
                                className="absolute right-2 top-2 rounded-md p-1 text-[#5a5a80] transition-colors hover:bg-[#141422] hover:text-foreground"
                                title="Copy URL"
                              >
                                {copied ? (
                                  <Check className="h-3.5 w-3.5 text-neon-green" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyUrl(presignedUrl)}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#141422] px-3 py-1.5 text-[10px] font-medium text-foreground transition-colors hover:bg-[#1a1a2e]"
                              >
                                {copied ? (
                                  <Check className="h-3 w-3 text-neon-green" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                {copied ? "Copied!" : "Copy URL"}
                              </button>
                              <a
                                href={presignedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#141422] px-3 py-1.5 text-[10px] font-medium text-foreground transition-colors hover:bg-[#1a1a2e]"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open in Tab
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Empty state */}
          {!loading && objects.length === 0 && prefixes.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <FolderOpen className="h-8 w-8 text-[#141422]" />
              <p className="text-xs text-[#5a5a80]">
                {prefix ? "This folder is empty" : "This bucket is empty"}
              </p>
            </div>
          )}

          {/* Load more */}
          {isTruncated && nextToken && (
            <button
              onClick={() => fetchObjects(selectedBucket, prefix, nextToken)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#18183066] bg-[#05050a]/40 py-2.5 text-[11px] font-medium text-[#5a5a80] transition-all hover:bg-[#0e0e1a] hover:text-foreground disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>Load more objects…</span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
