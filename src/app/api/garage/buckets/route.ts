import { garageApi, GarageApiError } from "@/lib/garage-api";
import { getClusterFromRequest } from "@/lib/cluster-from-request";
import { BucketListItem, BucketDetail } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);
    const list = await garageApi<BucketListItem[]>(cluster, "GET", "/v2/ListBuckets");

    // Fetch details for each bucket in parallel
    const details = await Promise.allSettled(
      list.map((b) =>
        garageApi<BucketDetail>(cluster, "GET", `/v2/GetBucketInfo?id=${b.id}`),
      ),
    );

    const buckets: BucketDetail[] = details
      .filter(
        (r): r is PromiseFulfilledResult<BucketDetail> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);

    return NextResponse.json(buckets);
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
    const data = await garageApi(cluster, "POST", "/v2/CreateBucket", body);
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
