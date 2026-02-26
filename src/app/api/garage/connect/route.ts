import { garageApi, GarageApiError } from "@/lib/garage-api";
import { getClusterFromRequest } from "@/lib/cluster-from-request";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);
    const body = await request.json();
    // v2: POST /v2/ConnectClusterNodes expects array of "node_id@address:port"
    const data = await garageApi(cluster, "POST", "/v2/ConnectClusterNodes", body);
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
