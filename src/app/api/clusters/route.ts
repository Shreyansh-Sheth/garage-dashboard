import { getClusters, ClusterInfo } from "@/lib/clusters";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clusters = getClusters();
  const publicList: ClusterInfo[] = clusters.map((c) => ({
    id: c.id,
    name: c.name,
    s3Endpoint: c.s3Endpoint,
    region: c.region,
  }));
  return NextResponse.json(publicList);
}
