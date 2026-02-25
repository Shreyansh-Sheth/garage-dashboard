import { garageApi, GarageApiError } from "@/lib/garage-api";
import { KeyListItem, KeyDetail } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await garageApi<KeyListItem[]>("GET", "/v2/ListKeys");

    // Fetch details for each key in parallel
    const details = await Promise.allSettled(
      list.map((k) =>
        garageApi<KeyDetail>("GET", `/v2/GetKeyInfo?id=${k.id}`),
      ),
    );

    const keys: KeyDetail[] = details
      .filter(
        (r): r is PromiseFulfilledResult<KeyDetail> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);

    return NextResponse.json(keys);
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
    const body = await request.json();
    const data = await garageApi("POST", "/v2/CreateKey", body);
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
