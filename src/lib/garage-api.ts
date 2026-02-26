import { ClusterConfig } from "./clusters";

export class GarageApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function garageApi<T = unknown>(
  cluster: ClusterConfig,
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  if (!cluster.adminUrl || !cluster.adminToken) {
    throw new GarageApiError(
      500,
      "Cluster adminUrl and adminToken must be configured",
    );
  }

  const url = `${cluster.adminUrl}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${cluster.adminToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GarageApiError(
      res.status,
      `Garage API ${method} ${endpoint}: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text() as unknown as T;
}
