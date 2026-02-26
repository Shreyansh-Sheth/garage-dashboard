export interface ClusterConfig {
  id: string;
  name: string;
  adminUrl: string;
  adminToken: string;
  s3Endpoint: string;
  region: string;
  replicationFactor: number;
}

export interface ClusterInfo {
  id: string;
  name: string;
  s3Endpoint: string;
  region: string;
}

export function getClusters(): ClusterConfig[] {
  const json = process.env.GARAGE_CLUSTERS;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: Record<string, unknown>) => ({
          id: String(c.id ?? "default"),
          name: String(c.name ?? c.id ?? "Default"),
          adminUrl: String(c.adminUrl ?? ""),
          adminToken: String(c.adminToken ?? ""),
          s3Endpoint: String(c.s3Endpoint ?? ""),
          region: String(c.region ?? "garage"),
          replicationFactor: Number(c.replicationFactor ?? 1),
        }));
      }
    } catch {
      // Fall through to single-cluster fallback
    }
  }

  // Backward compat: single cluster from flat env vars
  const adminUrl = process.env.GARAGE_ADMIN_URL;
  const adminToken = process.env.GARAGE_ADMIN_TOKEN;
  if (!adminUrl || !adminToken) return [];

  return [
    {
      id: "default",
      name: "Default",
      adminUrl,
      adminToken,
      s3Endpoint: process.env.NEXT_PUBLIC_GARAGE_S3_ENDPOINT ?? "",
      region: process.env.NEXT_PUBLIC_GARAGE_REGION ?? "garage",
      replicationFactor: parseInt(process.env.GARAGE_REPLICATION_FACTOR ?? "1", 10),
    },
  ];
}

export function getCluster(id: string): ClusterConfig | undefined {
  return getClusters().find((c) => c.id === id);
}

export function getDefaultCluster(): ClusterConfig | undefined {
  return getClusters()[0];
}
