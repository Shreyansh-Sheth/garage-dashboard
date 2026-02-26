import { garageApi, GarageApiError } from "@/lib/garage-api";
import { getClusterFromRequest } from "@/lib/cluster-from-request";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface V2Role {
  id: string;
  zone: string;
  capacity: number | null;
  tags: string[];
}

interface V2Layout {
  version: number;
  roles: V2Role[];
  stagedRoleChanges: V2Role[];
  parameters?: unknown;
  stagedParameters?: unknown;
}

export async function GET(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);
    const raw = await garageApi<V2Layout>(cluster, "GET", "/v2/GetClusterLayout");

    // Normalize arrays to Records for the frontend
    const roles: Record<string, { zone: string; capacity: number; tags: string[] }> = {};
    for (const r of raw.roles) {
      if (r.capacity !== null) {
        roles[r.id] = { zone: r.zone, capacity: r.capacity, tags: r.tags };
      }
    }

    const stagedRoleChanges: Record<string, { zone: string; capacity: number; tags: string[] } | null> = {};
    for (const r of raw.stagedRoleChanges) {
      stagedRoleChanges[r.id] = r.capacity !== null
        ? { zone: r.zone, capacity: r.capacity, tags: r.tags }
        : null;
    }

    return NextResponse.json({
      version: raw.version,
      roles,
      stagedRoleChanges,
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

export async function POST(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);
    const body = await request.json();

    // Frontend sends Record<nodeId, {zone, capacity, tags} | null>
    // v2 UpdateClusterLayout expects: { roles: [{id, zone, capacity, tags}] }
    let roles: { id: string; zone: string; capacity: number | null; tags: string[] }[] = [];

    if (body && !Array.isArray(body)) {
      roles = Object.entries(body).map(([id, role]) => {
        if (role === null) {
          return { id, zone: "", capacity: null, tags: [] };
        }
        const r = role as { zone: string; capacity: number; tags: string[] };
        return { id, zone: r.zone, capacity: r.capacity, tags: r.tags };
      });
    }

    const data = await garageApi(cluster, "POST", "/v2/UpdateClusterLayout", { roles });
    return NextResponse.json(data);
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
