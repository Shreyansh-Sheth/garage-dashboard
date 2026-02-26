"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi, useClusterId, useRole } from "@/lib/hooks";
import { ClusterInfo } from "@/lib/clusters";
import {
  HealthResponse,
  StatusResponse,
  BucketDetail,
  KeyDetail,
} from "@/lib/types";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { NodesPanel } from "@/components/dashboard/nodes-panel";
import { BucketsPanel } from "@/components/dashboard/buckets-panel";
import { KeysPanel } from "@/components/dashboard/keys-panel";
import { HealthPanel } from "@/components/dashboard/health-panel";
import { CreatePanel } from "@/components/dashboard/create-panel";
import { BucketExplorer } from "@/components/dashboard/bucket-explorer";
import { LayoutCreator } from "@/components/dashboard/layout-creator";
import { MetricsPanel } from "@/components/dashboard/metrics-panel";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background atmosphere"><div className="text-[#5a5a80] text-sm">Loading...</div></div>}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clusterId = useClusterId();
  const activeSection = searchParams.get("section") ?? "overview";

  const role = useRole();
  const readOnly = role === "readonly";
  const clusters = useApi<ClusterInfo[]>("/api/clusters");
  const activeClusterInfo = clusters.data?.find((c) => c.id === clusterId) ?? clusters.data?.[0];

  const setActiveSection = useCallback(
    (section: string) => {
      const params = new URLSearchParams();
      if (clusterId) params.set("cluster", clusterId);
      params.set("section", section);
      router.replace(`/?${params.toString()}`);
    },
    [router, clusterId],
  );

  const setCluster = useCallback(
    (id: string) => {
      const params = new URLSearchParams();
      params.set("cluster", id);
      params.set("section", "overview");
      router.replace(`/?${params.toString()}`);
    },
    [router],
  );

  const health = useApi<HealthResponse>("/api/garage/health", clusterId);
  const status = useApi<StatusResponse>("/api/garage/status", clusterId);
  const buckets = useApi<BucketDetail[]>("/api/garage/buckets", clusterId);
  const keys = useApi<KeyDetail[]>("/api/garage/keys", clusterId);

  const anyLoading =
    health.loading || status.loading || buckets.loading || keys.loading;

  const refreshAll = useCallback(() => {
    health.refresh();
    status.refresh();
    buckets.refresh();
    keys.refresh();
  }, [health, status, buckets, keys]);

  const connectionError =
    health.error && status.error && buckets.error && keys.error;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background atmosphere">
      <Header
        health={health.data}
        onRefresh={refreshAll}
        loading={anyLoading}
        clusterInfo={activeClusterInfo}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          clusters={clusters.data ?? []}
          activeCluster={clusterId}
          onClusterChange={setCluster}
          readOnly={readOnly}
        />

        <main className="relative z-[1] flex-1 overflow-y-auto px-6 py-5 grid-bg">
          {connectionError ? (
            <ConnectionError error={health.error!} onRetry={refreshAll} />
          ) : (
            <>
              {activeSection === "overview" && (
                <OverviewSection
                  health={health.data}
                  status={status.data}
                  buckets={buckets.data ?? []}
                  keys={keys.data ?? []}
                />
              )}
              {activeSection === "nodes" && (
                <Section title="Nodes" subtitle="Cluster node management and monitoring">
                  <NodesPanel status={status.data} />
                </Section>
              )}
              {activeSection === "layout" && !readOnly && (
                <Section
                  title="Cluster Layout"
                  subtitle="Manage node zone assignments, capacity, and cluster topology"
                >
                  <LayoutCreator status={status.data} onStatusRefresh={status.refresh} clusterId={clusterId} />
                </Section>
              )}
              {activeSection === "buckets" && (
                <Section title="Buckets" subtitle="S3-compatible bucket management">
                  <BucketsPanel buckets={buckets.data ?? []} />
                </Section>
              )}
              {activeSection === "explorer" && (
                <Section
                  title="Explorer"
                  subtitle="Browse bucket objects and generate presigned URLs"
                >
                  <BucketExplorer buckets={buckets.data ?? []} key={clusterId ?? "default"} clusterId={clusterId} />
                </Section>
              )}
              {activeSection === "keys" && (
                <Section
                  title="Access Keys"
                  subtitle="S3 credential management"
                >
                  <KeysPanel keys={keys.data ?? []} />
                </Section>
              )}
              {activeSection === "metrics" && (
                <Section
                  title="Metrics"
                  subtitle="S3 operations, disk I/O, and API request analytics"
                >
                  <MetricsPanel clusterId={clusterId} />
                </Section>
              )}
              {activeSection === "health" && (
                <Section
                  title="Health"
                  subtitle="Cluster health diagnostics and system info"
                >
                  <HealthPanel health={health.data} status={status.data} />
                </Section>
              )}
              {activeSection === "create" && !readOnly && (
                <Section
                  title="Create"
                  subtitle="Provision new resources and manage permissions"
                >
                  <CreatePanel
                    buckets={buckets.data ?? []}
                    keys={keys.data ?? []}
                    onCreated={refreshAll}
                    clusterId={clusterId}
                  />
                </Section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="animate-in stagger-1">
        <h2 className="font-heading text-2xl font-bold tracking-wide text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] tracking-wide text-[#5a5a80]">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

function OverviewSection({
  health,
  status,
  buckets,
  keys,
}: {
  health: HealthResponse | null;
  status: StatusResponse | null;
  buckets: BucketDetail[];
  keys: KeyDetail[];
}) {
  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="animate-in stagger-1">
        <h2 className="font-heading text-2xl font-bold tracking-wide text-foreground">
          Overview
        </h2>
        <p className="mt-0.5 text-[11px] tracking-wide text-[#5a5a80]">
          Garage S3 cluster status and resources
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        health={health}
        status={status}
        buckets={buckets}
        keys={keys}
      />

      {/* Nodes + Health */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NodesPanel status={status} />
        </div>
        <HealthPanel health={health} status={status} />
      </div>

      {/* Buckets + Keys */}
      <div className="grid gap-4 xl:grid-cols-2">
        <BucketsPanel buckets={buckets} />
        <KeysPanel keys={keys} />
      </div>
    </div>
  );
}

function ConnectionError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-in stagger-1 max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff0055]/8 ring-1 ring-[#ff0055]/15">
          <AlertTriangle className="h-7 w-7 text-neon-pink" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Connection Failed
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5a5a80]">
          Cannot reach the Garage admin API. Verify the endpoint is
          accessible and the admin token is valid.
        </p>
        <div className="mx-auto mt-4 max-w-md rounded-xl bg-[#ff0055]/5 p-4 ring-1 ring-[#ff0055]/10">
          <p className="break-all font-mono text-xs leading-relaxed text-neon-pink/80">
            {error}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#00f0ff25] bg-[#00f0ff08] px-6 py-2.5 text-sm font-medium text-neon-cyan transition-all hover:bg-[#00f0ff12]"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </div>
    </div>
  );
}
