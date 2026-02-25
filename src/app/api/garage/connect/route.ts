import { garageApi, GarageApiError } from "@/lib/garage-api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // v2: POST /v2/ConnectClusterNodes expects array of "node_id@address:port"
    const data = await garageApi("POST", "/v2/ConnectClusterNodes", body);
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
