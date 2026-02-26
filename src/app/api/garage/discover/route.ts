import { garageApi, GarageApiError } from "@/lib/garage-api";
import { getClusterFromRequest } from "@/lib/cluster-from-request";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface V2Node {
  id: string;
  addr: string;
  hostname: string;
  isUp: boolean;
  role: { zone: string; capacity: number; tags: string[] } | null;
}

interface V2StatusResponse {
  nodes: V2Node[];
}

/**
 * POST /api/garage/discover
 * Takes { ip, adminPort?, rpcPort? }
 * 1. Calls the remote node's admin API to discover its node ID
 * 2. Connects it to the current cluster via ConnectClusterNodes
 */
export async function POST(request: Request) {
  try {
    const cluster = getClusterFromRequest(request);
    const { ip, adminPort = 3903, rpcPort = 3901 } = await request.json();

    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 });
    }

    const trimmedIp = ip.trim();

    // Step 1: Call the remote node's admin API to get its node ID
    const remoteUrl = `http://${trimmedIp}:${adminPort}/v2/GetClusterStatus`;
    let remoteStatus: V2StatusResponse;

    try {
      const res = await fetch(remoteUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${cluster.adminToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Remote node responded ${res.status}: ${text}` },
          { status: 502 },
        );
      }

      remoteStatus = await res.json();
    } catch {
      return NextResponse.json(
        { error: `Cannot reach ${trimmedIp}:${adminPort} — is the admin API accessible?` },
        { status: 502 },
      );
    }

    // Find the node that matches this IP (or take the first "self" node)
    const selfNode = remoteStatus.nodes.find(
      (n) => n.isUp && n.addr.includes(trimmedIp),
    ) || remoteStatus.nodes.find((n) => n.isUp);

    if (!selfNode) {
      return NextResponse.json(
        { error: "Could not determine node ID from remote status" },
        { status: 502 },
      );
    }

    const nodeId = selfNode.id;
    const connectAddr = `${nodeId}@${trimmedIp}:${rpcPort}`;

    // Step 2: Connect this node to our cluster
    const data = await garageApi(cluster, "POST", "/v2/ConnectClusterNodes", [connectAddr]);

    return NextResponse.json({
      nodeId,
      hostname: selfNode.hostname,
      address: connectAddr,
      connected: true,
      result: data,
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
