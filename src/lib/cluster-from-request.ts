import { ClusterConfig, getCluster, getDefaultCluster } from "./clusters";

export function getClusterFromRequest(request: Request): ClusterConfig {
  const url = new URL(request.url);
  const clusterId = url.searchParams.get("clusterId");

  if (clusterId) {
    const cluster = getCluster(clusterId);
    if (cluster) return cluster;
  }

  const fallback = getDefaultCluster();
  if (!fallback) {
    throw new Error("No cluster configured. Set GARAGE_CLUSTERS or GARAGE_ADMIN_URL/GARAGE_ADMIN_TOKEN in .env.local");
  }
  return fallback;
}
