import { garageApi, GarageApiError } from "@/lib/garage-api";
import { getClusterFromRequest } from "@/lib/cluster-from-request";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);
    const data = await garageApi(cluster, "GET", "/v2/GetClusterHealth");

    // Normalize v2 field names to match our HealthResponse type
    const raw = data as Record<string, unknown>;
    return NextResponse.json({
      status: raw.status,
      knownNodes: raw.knownNodes,
      connectedNodes: raw.connectedNodes,
      storageNodes: raw.storageNodes,
      storageNodesOk: raw.storageNodesUp ?? raw.storageNodesOk ?? 0,
      partitions: raw.partitions,
      partitionsQuorum: raw.partitionsQuorum,
      partitionsAllOk: raw.partitionsAllOk,
    });
  } catch (e) {
    if (e instanceof GarageApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 502 },
    );
  }
}
