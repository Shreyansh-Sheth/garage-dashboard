import { garageApi, GarageApiError } from "@/lib/garage-api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface V2Node {
  id: string;
  garageVersion: string;
  addr: string;
  hostname: string;
  isUp: boolean;
  lastSeenSecsAgo: number | null;
  role: { zone: string; capacity: number; tags: string[] } | null;
  draining: boolean;
  dataPartition?: { available: number; total: number };
  metadataPartition?: { available: number; total: number };
}

interface V2StatusResponse {
  layoutVersion: number;
  nodes: V2Node[];
  garageVersion?: string;
  garageFeatures?: string[];
  rustVersion?: string;
  dbEngine?: string;
}

export async function GET() {
  try {
    const raw = await garageApi<V2StatusResponse>("GET", "/v2/GetClusterStatus");

    // Normalize v2 array into Record<string, NodeInfo> for the frontend
    const nodesRecord: Record<string, {
      addr: string;
      isUp: boolean;
      lastSeenSecsAgo: number | null;
      hostname: string;
      zone?: string;
      capacity?: number;
      tags?: string[];
      dataPartition?: { available: number; total: number };
    }> = {};

    let garageVersion = "";
    let dbEngine = "";

    for (const n of raw.nodes) {
      if (!garageVersion && n.garageVersion) garageVersion = n.garageVersion;
      nodesRecord[n.id] = {
        addr: n.addr,
        isUp: n.isUp,
        lastSeenSecsAgo: n.lastSeenSecsAgo,
        hostname: n.hostname,
        zone: n.role?.zone,
        capacity: n.role?.capacity,
        tags: n.role?.tags,
        dataPartition: n.dataPartition,
      };
    }

    return NextResponse.json({
      node: raw.nodes[0]?.id ?? "",
      garageVersion: raw.garageVersion || garageVersion,
      garageFeatures: raw.garageFeatures || [],
      rustVersion: raw.rustVersion || "",
      dbEngine: raw.dbEngine || dbEngine,
      layoutVersion: raw.layoutVersion,
      nodes: nodesRecord,
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
